import * as opentracing from "opentracing";
import logger from "../../util/logger";
const initJaegerTracer = require("jaeger-client").initTracer;

function initTracer(serviceName: string) {
  const config = {
    serviceName: serviceName,
    sampler: {
      type: "probabilistic",
      param: 1,
    },
    reporter: {
      agentHost: process.env.JAEGER_ENDPOINT,
      agentPort: 6832,
      logSpans: true, // when set to true, this logs whenever we send a span
    },
  };
  const options = {
    logger: {
      info: function logInfo(msg: string) {
        console.log("INFO  ", msg);
      },
      error: function logError(msg: string) {
        console.log("ERROR ", msg);
      },
    },
  };
  return initJaegerTracer(config, options);
}
export const tracer = initTracer("dg-api-gate") as opentracing.Tracer;

export const injectRootSpan = (req, res, next) => {
  logger.debug(`creating root span`);
  req.rootSpan = tracer.startSpan(req.originalUrl);
  logger.debug(`injecting root span`);
  tracer.inject(req.rootSpan, opentracing.FORMAT_HTTP_HEADERS, req);
  next();
};

export function createControllerSpan(
  controller: string,
  operation: string,
  headers: any
) {
  let traceSpan: opentracing.Span;

  traceSpan = tracer.startSpan(operation, {
    childOf: tracer.extract(opentracing.FORMAT_HTTP_HEADERS, headers),
    tags: {
      [opentracing.Tags.SPAN_KIND]: opentracing.Tags.SPAN_KIND_RPC_SERVER,
      [opentracing.Tags.COMPONENT]: controller,
    },
  });
  return traceSpan;
}

export function tracedSubAction(
  parentSpan?: opentracing.Span,
  spanName: string = "sub-action"
) {
  let traceSpan: opentracing.Span;
  traceSpan = tracer.startSpan(spanName, {
    childOf: parentSpan,
    tags: {
      [opentracing.Tags.SPAN_KIND]: opentracing.Tags.SPAN_KIND_RPC_SERVER,
    },
  });
  return traceSpan;
}

export function finishSpanWithResult(
  span: opentracing.Span,
  status: number,
  errorTag?: boolean
) {
  span.setTag(opentracing.Tags.HTTP_STATUS_CODE, status);
  if (errorTag) {
    span.setTag(opentracing.Tags.ERROR, true);
  }
  span.finish();
}
