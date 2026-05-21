#!/usr/bin/env bash
# Pulls 30-day usage metrics from CloudWatch across every enabled region for
# the current AWS profile. Read-only. Output goes to stdout — redirect to a
# file if you want to keep it: `./scripts/aws-metrics.sh > metrics.txt`.
#
# Requires: aws-cli (configured), jq, BSD date (macOS default).
set -euo pipefail

START=$(date -u -v-30d +%Y-%m-%dT%H:%M:%SZ)
END=$(date -u +%Y-%m-%dT%H:%M:%SZ)
PERIOD=86400

hr() { printf '%s\n' "------------------------------------------------------------"; }

hr
echo "  AWS metrics — last 30 days"
echo "  Window: $START → $END"
hr

aws sts get-caller-identity --output json | jq -r '
  "Account: \(.Account)\nIdentity: \(.Arn)\n"
'

# Default to all enabled regions on this account. Falls back to a common
# shortlist if ec2:DescribeRegions is denied.
REGIONS=$(aws ec2 describe-regions --query 'Regions[].RegionName' --output text 2>/dev/null \
  || echo "us-east-1 us-east-2 us-west-1 us-west-2 eu-west-1 eu-central-1 ap-northeast-1 ap-southeast-1")

sum_metric() {
  local region=$1 ns=$2 metric=$3 dims=${4:-}
  local dim_arg=()
  [ -n "$dims" ] && dim_arg=(--dimensions "$dims")
  aws cloudwatch get-metric-statistics \
    --region "$region" \
    --namespace "$ns" \
    --metric-name "$metric" \
    ${dim_arg[@]+"${dim_arg[@]}"} \
    --start-time "$START" \
    --end-time "$END" \
    --period "$PERIOD" \
    --statistics Sum \
    --output json 2>/dev/null \
    | jq '[.Datapoints[].Sum] | add // 0 | floor'
}

lambda_total=0
echo
echo "## Lambda invocations"
for r in $REGIONS; do
  count=$(sum_metric "$r" AWS/Lambda Invocations)
  if [ "${count:-0}" != "0" ]; then
    printf "  %-16s %s\n" "$r" "$count"
    lambda_total=$((lambda_total + count))
  fi
done
printf "  %-16s %s\n" "subtotal" "$lambda_total"

alb_req_total=0
alb_2xx_total=0
echo
echo "## ALB requests (per load balancer)"
for r in $REGIONS; do
  arns=$(aws elbv2 describe-load-balancers \
    --region "$r" \
    --query 'LoadBalancers[?Type==`application`].LoadBalancerArn' \
    --output text 2>/dev/null || echo "")
  for arn in $arns; do
    [ -z "$arn" ] && continue
    dim=$(echo "$arn" | sed 's|.*loadbalancer/||')
    req=$(sum_metric "$r" AWS/ApplicationELB RequestCount "Name=LoadBalancer,Value=$dim")
    twoxx=$(sum_metric "$r" AWS/ApplicationELB HTTPCode_Target_2XX_Count "Name=LoadBalancer,Value=$dim")
    printf "  %-16s %-44s req=%s  2xx=%s\n" "$r" "$dim" "$req" "$twoxx"
    alb_req_total=$((alb_req_total + req))
    alb_2xx_total=$((alb_2xx_total + twoxx))
  done
done
printf "  %-16s %-44s req=%s  2xx=%s\n" "subtotal" "" "$alb_req_total" "$alb_2xx_total"

apigw_total=0
echo
echo "## API Gateway requests"
for r in $REGIONS; do
  count=$(sum_metric "$r" AWS/ApiGateway Count)
  if [ "${count:-0}" != "0" ]; then
    printf "  %-16s %s\n" "$r" "$count"
    apigw_total=$((apigw_total + count))
  fi
done
printf "  %-16s %s\n" "subtotal" "$apigw_total"

ddb_read_total=0
ddb_write_total=0
echo
echo "## DynamoDB capacity consumed (proxy for read/write traffic)"
for r in $REGIONS; do
  reads=$(sum_metric "$r" AWS/DynamoDB ConsumedReadCapacityUnits)
  writes=$(sum_metric "$r" AWS/DynamoDB ConsumedWriteCapacityUnits)
  if [ "${reads:-0}" != "0" ] || [ "${writes:-0}" != "0" ]; then
    printf "  %-16s reads=%s  writes=%s\n" "$r" "$reads" "$writes"
    ddb_read_total=$((ddb_read_total + reads))
    ddb_write_total=$((ddb_write_total + writes))
  fi
done
printf "  %-16s reads=%s  writes=%s\n" "subtotal" "$ddb_read_total" "$ddb_write_total"

sqs_total=0
echo
echo "## SQS messages sent"
for r in $REGIONS; do
  count=$(sum_metric "$r" AWS/SQS NumberOfMessagesSent)
  if [ "${count:-0}" != "0" ]; then
    printf "  %-16s %s\n" "$r" "$count"
    sqs_total=$((sqs_total + count))
  fi
done
printf "  %-16s %s\n" "subtotal" "$sqs_total"

cf_total=0
echo
echo "## CloudFront requests (us-east-1 only — CloudFront is global)"
cf_total=$(sum_metric us-east-1 AWS/CloudFront Requests)
printf "  %-16s %s\n" "total" "$cf_total"

echo
hr
echo "  Summary — last 30 days, all regions"
hr
printf "  %-26s %s\n" "Lambda invocations:" "$lambda_total"
printf "  %-26s %s\n" "ALB requests:" "$alb_req_total"
printf "  %-26s %s\n" "ALB 2xx responses:" "$alb_2xx_total"
printf "  %-26s %s\n" "API Gateway requests:" "$apigw_total"
printf "  %-26s %s\n" "DynamoDB read units:" "$ddb_read_total"
printf "  %-26s %s\n" "DynamoDB write units:" "$ddb_write_total"
printf "  %-26s %s\n" "SQS messages sent:" "$sqs_total"
printf "  %-26s %s\n" "CloudFront requests:" "$cf_total"
hr
