import express from "express";
import * as bodyParser from "body-parser";
import { Routes } from "./routes/JsonDocRoutes";
import { injectRootSpan } from "./helpers/openTracing/tracer-middleware";
export default class App {
  public app: express.Application;
  public routePrv: Routes = new Routes();

  constructor() {
    this.app = express();
    this.config();
    this.app.use(injectRootSpan);
    this.routePrv.routes(this.app);
  }

  private config(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }
}
