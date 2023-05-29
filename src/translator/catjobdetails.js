import axios from "axios";
import sendResponse from "../../lib/sendResponse";
async function jobdetails(event, context) {
  const { id_project, password } = JSON.parse(event.body);
  const headers = {
    "x-matecat-key": `${process.env.API_KEY}-${process.env.SECRET_KEY}`,
  };
  try{
    const response = await axios.get(
        `https://www.matecat.com/api/v2/projects/${id_project}/${password}`,
        {
          headers: {
            ...headers,
          },
        }
      );
      const data = response.data
      return sendResponse(200, {data})
  }catch(err){
    console.error(err)
    return sendResponse(501, {error: err})
  }
 
}
export const handler = jobdetails;
