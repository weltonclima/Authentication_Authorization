import axios, { AxiosError } from "axios";
import { GetServerSidePropsContext } from "next";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../Contexts/AuthContext";
import { AuthTokenError } from "./error/AuthTokenError";

let isRefreshing = false;
let failedRequestQueue = new Array;

export function setupAPICLient(ctx: GetServerSidePropsContext | undefined = undefined) {
  //const ctx = props ?? undefined

  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  });

  api.interceptors.response.use(res => {
    return res;
  }, (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (error.response.data?.code === 'token.expired') {

        const cookies = parseCookies(ctx);

        const { 'nextauth.refreshToken': refreshToken } = cookies;
        const originalConfig = error.config;

        if (!isRefreshing) {
          isRefreshing = true;
          
          api.post('/refresh', {
            refreshToken
          }).then(res => {
            const { token } = res.data;

            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, //30 days
              path: '/'
            });
            setCookie(ctx, 'nextauth.refreshToken', res.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30, //30 days
              path: '/'
            });

            api.defaults.headers['Authorization'] = `Bearer ${token}`;

            failedRequestQueue.forEach(req => req.onSuccess(token))
            failedRequestQueue = [];

          }).catch(err => {
            failedRequestQueue.forEach(req => req.onFailure(err))
            failedRequestQueue = [];
            process.browser && signOut();

          }).finally(() => {
            isRefreshing = false;
          })
        }

        return new Promise((resolve, reject) => {
          failedRequestQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers['Authorization'] = `Bearer ${token}`;

              resolve(api(originalConfig))
            },
            onFailure: (err: AxiosError) => {
              reject(err);
            }
          })
        })

      } else {
        if (process.browser) {
          signOut();
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
    return Promise.reject(error);
  });
  return api;
}