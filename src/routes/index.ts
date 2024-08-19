import express, { Request, Response, Router } from "express";
import { validateLoginInput } from "../validator";

export default (): Router => {
  var router: Router = express.Router();

  router.post("/login", (req: Request, res: Response) => {
    const { errors, isValid } = validateLoginInput(req.body);
  });
};
