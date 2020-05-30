import twitter from "../twitter.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";

config({
  path: "./example/.env",
  export: true
});

const client = new twitter({
  consumer_key: Deno.env.get("CONSUMER_KEY"),
  consumer_secret: Deno.env.get("CONSUMER_SECRET"),
  bearer_token: Deno.env.get("BEARER_TOKEN")
});

const params = {
  q: "#EStreamerCoders -filter:retweets",
  tweet_mode: "extended"
};
client.get("search/tweets", params, function (
  error: any,
  tweets: any,
  response: any
) {
  if (!error) {
    console.log(tweets);
  }
});
