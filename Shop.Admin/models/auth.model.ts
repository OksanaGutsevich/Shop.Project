import axios from "axios";
import { IAuthRequisites } from "@Shared/types";
import { API_HOST } from "./const";

export async function verifyRequisites(
  requisites: IAuthRequisites,
): Promise<boolean> {
  try {
    console.log(
      "DEBUG verifyRequisites: API_HOST=",
      API_HOST,
      "requisites=",
      requisites,
    );
    const response = await axios.post(`${API_HOST}/auth`, requisites);
    console.log(
      "DEBUG verifyRequisites: response.status=",
      response.status,
      "data=",
      response.data,
    );

    return response.status === 200;
  } catch (e) {
    console.error("ERROR verifyRequisites:", (e as any)?.response?.data || e);
    return false;
  }
}
