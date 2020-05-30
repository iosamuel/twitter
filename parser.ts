"use strict";

// glorious streaming json parser, built specifically for the twitter streaming api
// assumptions:
//   1) ninjas are mammals
//   2) tweets come in chunks of text, surrounded by {}'s, separated by line breaks
//   3) only one tweet per chunk
//
//   p = new parser.instance()
//   p.addListener('object', function...)
//   p.receive(data)
//   p.receive(data)
//   ...

import EventEmitter from "./events.ts";

export default class Parser extends EventEmitter {
  buffer = "";

  static END = "\r\n";
  static END_LENGTH = 2;

  constructor() {
    super();
  }

  receive(buffer: ArrayBuffer) {
    const decoder = new TextDecoder();
    this.buffer += decoder.decode(buffer);
    let index, json;

    // We have END?
    while ((index = this.buffer.indexOf(Parser.END)) > -1) {
      json = this.buffer.slice(0, index);
      this.buffer = this.buffer.slice(index + Parser.END_LENGTH);
      if (json.length > 0) {
        try {
          json = JSON.parse(json);
          // Event message
          if (json.event !== undefined) {
            // First emit specific event
            this.emit(json.event, json);
            // Now emit catch-all event
            this.emit("event", json);
          }
          // Delete message
          else if (json.delete !== undefined) {
            this.emit("delete", json);
          }
          // Friends message (beginning of stream)
          else if (
            json.friends !== undefined ||
            json.friends_str !== undefined
          ) {
            this.emit("friends", json);
          }
          // Any other message
          else {
            this.emit("data", json);
          }
        } catch (error) {
          error.source = json;
          this.emit("error", error);
        }
      } else {
        // Keep Alive
        this.emit("ping");
      }
    }
  }
}
