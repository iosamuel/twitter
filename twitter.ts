"use strict";

/**
 * Module dependencies
 */
// import Streamparser from "./parser.ts";
import merge from "https://deno.land/x/lodash/merge.js";

// Package version
const VERSION = 0.1;

interface Bases {
  rest: string;
  stream: string;
  user_stream: string;
  site_stream: string;
  media: string;
}
class Twitter {
  VERSION = VERSION;
  requestDefaults: any;

  constructor(public options: any) {
    this.options = merge(
      {
        consumer_key: null,
        consumer_secret: null,
        access_token_key: null,
        access_token_secret: null,
        bearer_token: null,
        rest_base: "https://api.twitter.com/1.1",
        stream_base: "https://stream.twitter.com/1.1",
        user_stream_base: "https://userstream.twitter.com/1.1",
        site_stream_base: "https://sitestream.twitter.com/1.1",
        media_base: "https://upload.twitter.com/1.1",
        request_options: {
          headers: {
            Accept: "*/*",
            Connection: "close",
            "User-Agent": "node-twitter/" + VERSION
          }
        }
      },
      options
    );

    let authentication_options: {
      oauth?: {
        consumer_key: string;
        consumer_secret: string;
        token: string;
        token_secret: string;
      };
      headers?: Headers;
    } = {
      oauth: {
        consumer_key: this.options.consumer_key,
        consumer_secret: this.options.consumer_secret,
        token: this.options.access_token_key,
        token_secret: this.options.access_token_secret
      }
    };

    // Check to see if we are going to use User Authentication or Application Authetication
    if (this.options.bearer_token) {
      const headers = new Headers();
      headers.set("Authorization", "Bearer " + this.options.bearer_token);
      authentication_options = {
        headers: headers
      };
    }

    // Configure default request options
    this.requestDefaults = merge(
      this.options.request_options,
      authentication_options
    );
  }

  __buildEndpoint(path: string, base: keyof Bases) {
    const bases: Bases = {
      rest: this.options.rest_base,
      stream: this.options.stream_base,
      user_stream: this.options.user_stream_base,
      site_stream: this.options.site_stream_base,
      media: this.options.media_base
    };
    let endpoint = bases.hasOwnProperty(base) ? bases[base] : bases.rest;
    // if full url is specified we use that
    let isFullUrl = false;
    try {
      isFullUrl = new URL(path).protocol !== null;
    } catch (e) {}
    if (isFullUrl) {
      endpoint = path;
    } else {
      // If the path begins with media or /media
      if (path.match(/^(\/)?media/)) {
        endpoint = bases.media;
      }
      endpoint += path.charAt(0) === "/" ? path : "/" + path;
    }

    // Remove trailing slash
    endpoint = endpoint.replace(/\/$/, "");

    if (!isFullUrl) {
      // Add json extension if not provided in call... only if a full url is not specified
      endpoint += path.split(".").pop() !== "json" ? ".json" : "";
    }

    return endpoint;
  }

  __request(method: string, path: string, params: any, callback?: Function) {
    let base: keyof Bases = "rest",
      cb: Function,
      promise = false;

    // Set the callback if no params are passed
    if (typeof params === "function") {
      cb = params;
      params = {};
    }
    // Return promise if no callback is passed and promises available
    else if (callback === undefined) {
      promise = true;
    } else {
      cb = callback;
    }

    // Set API base
    if (typeof params.base !== "undefined") {
      base = params.base;
      delete params.base;
    }

    // Build the options to pass to our custom request object
    const options = merge(this.requestDefaults, {
      method: method.toLowerCase() // Request method - get || post
    });

    let url = this.__buildEndpoint(path, base); // Generate url

    // Pass url parameters if get
    if (method === "get") {
      const qs = "?" + new URLSearchParams(params).toString();
      url += qs;
    }

    const request = new Request(url, options);

    // Promisified version
    if (promise) {
      return new Promise(function (resolve, reject) {
        fetch(request)
          .then(res => res.json())
          .then(data => {
            // response object errors
            // This should return an error object not an array of errors
            if (data.errors !== undefined) {
              return reject(data.errors);
            }

            // no errors
            resolve(data);
          })
          .catch((error: any) => {
            reject(error);
          });
      });
    }

    // Callback version
    fetch(request)
      .then(async response => {
        const data = await response.json();

        // response object errors
        // This should return an error object not an array of errors
        if (data.errors !== undefined) {
          return cb(data.errors, data, response);
        }
        // no errors
        cb(null, data, response);
      })
      .catch((error: any) => {
        cb(error);
      });
  }

  /**
   * GET
   */
  get(url: string, params: any, callback?: Function) {
    return this.__request("get", url, params, callback);
  }

  /**
   * POST
   */
  post(url: string, params: any, callback?: Function) {
    return this.__request("post", url, params, callback);
  }

  /**
   * STREAM
   * TODO: Implement this in DENO
   */
}

export default Twitter;
