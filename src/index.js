// const { stat } = require("original-fs");

const delay = async (millis) => new Promise((r) => setTimeout(r, millis));
var plainspeed = 15;
var highspeed = 30;
var linespeed = 100;
var speedmulti = 1;
var destroyDelay = 2000;

var containersperline = 3;

var containers = [];

var cdata;
var cindex = 0;
$(document).ready(() => {
  let infobox = $("#infobox");

  $(window).keypress((e) => {
    switch (e.keyCode) {
      case 32:
        speedmulti = 0.1;
        break;
      case 92:
        speedmulti = 2;
        destroyDelay = 1000;
        break;
    }
  });
  $(window).keyup((e) => {
    console.log(e.keyCode);
    switch (e.keyCode) {
      case 32:
        speedmulti = 1;
        break;
      case 220:
        console.log("????");
        speedmulti = 1;
        destroyDelay = 2000;
        break;
    }
  });

  window.api.ipcd.send("git", { type: "fetch" });

  window.api.ongit((res, req) => {
    // console.log(req);
    console.log("git sent. " + req.message);
    cdata = req.data;

    infobox.removeClass("hidden");
    $(infobox.children()[0]).text(req.message);
    $(infobox.children()[1]).text("Author: " + req.author);

    setTimeout(() => {
      infobox.addClass("hidden");
      nextCode();
    }, destroyDelay);
  });
});

function nextCode() {
  while (cindex < cdata.length) {
    console.log(containers);
    if (containers.length < containersperline) {
      containers.push(new CodeContainer(cdata[cindex]));
      cindex++;
    } else {
      return;
    }
  }
  if (containers.length == 0) {
    window.api.ipcd.send("git", { type: "fetch" });
    cindex = 0;
  }
}

class CodeContainer {
  constructor(codebase) {
    this.title = codebase.file;
    this.container = this.appendContainer();
    let reparsedcode = "";
    codebase.code.forEach((element) => {
      reparsedcode += element.code + "\n";
    });
    this.code = parseDOM(hljs.highlightAuto(reparsedcode).value);
    // console.log(this.code);
    this.fullRender(this.code);
  }
  appendContainer() {
    let main = $("#main");
    let container = $(`<div class="m-container codecontainer">`);
    let title = $(`<div class = "page-title">`);
    let pre = $("<pre>");
    let code = $(`<code class="hljs code codearea">`);

    title.text(this.title);

    main.append(container);
    container.append(title);
    container.append(pre);
    pre.append(code);
    return container;
  }
  async fullRender(code) {
    console.log("start");
    let i = 0;
    let codeblock = this.container.children().children();
    while (i < code.length) {
      let c = code[i];
      if (speedmulti != 2) {
        await delay(linespeed * speedmulti);
      } else {
        await delay(10);
      }
      if (speedmulti != 2) {
        let strindex = 0;
        while (strindex < c.plaintext.length) {
          let char = c.plaintext[strindex];
          if (char == "&") {
            let buffer = "";
            let nchar = null;
            let nindex = strindex;
            while (nchar != ";") {
              nchar = c.plaintext[nindex];
              buffer += nchar;
              nindex++;
            }
            strindex = nindex;
            codeblock.append(buffer);
          } else {
            codeblock.append(char);
            strindex++;
          }
          await delay(plainspeed * speedmulti);
        }
      } else {
        codeblock.append(c.plaintext);
      }

      if (speedmulti != 2) {
        let cblock = $(c.start);
        codeblock.append(cblock);
        let strindex = 0;
        while (strindex < c.content.length) {
          let char = c.content[strindex];
          if (char == "&") {
            let buffer = "";
            let nchar = null;
            let nindex = strindex;
            while (nchar != ";") {
              nchar = c.content[nindex];
              buffer += nchar;
              nindex++;
            }
            strindex = nindex;
            cblock.append(buffer);
          } else {
            cblock.append(char);
            strindex++;
          }
          await delay(highspeed * speedmulti);
        }
      } else {
        codeblock.append(c.start + c.content + c.end);
      }

      this.container.scrollTop(9999999);
      i++;
    }
    // this.container.css("background-color", "crimson");
    setTimeout(() => this.destroy(), destroyDelay * speedmulti);
  }
  destroy() {
    containers = containers.filter((f) => {
      return f != this;
    });
    this.container.remove();
    nextCode();
  }
}

function parseDOM(string) {
  let parsed = [];

  // format we want
  // [{plaintext: 1 = 2, start: "<div>",content: "alert(1)",end: "</div>"}, ...]
  let currentindex = 0;

  let state = "global";
  let buffer = "";

  let currentblock = null;

  let blockstate = "start";

  while (currentindex < string.length) {
    let char = string[currentindex];
    switch (state) {
      case "global":
        if (char == "<") {
          state = "element";
          if (blockstate == "content") {
            currentblock.content = buffer;
            buffer = "";
            blockstate = "end";
          } else {
            if (currentblock != null) {
              parsed.push(currentblock);
            }
            currentblock = { plaintext: buffer };
            buffer = "";
          }
          buffer += char;
        } else {
          buffer += char;
        }
        break;
      case "element":
        if (char == ">") {
          state = "global";
          buffer += char;
          switch (blockstate) {
            case "start":
              currentblock.start = buffer;
              blockstate = "content";
              break;
            case "end":
              currentblock.end = buffer;
              blockstate = "start";
              break;
          }

          buffer = "";
        } else {
          buffer += char;
        }
        break;
    }
    currentindex++;
  }
  if (currentblock != null) {
    currentblock.content = buffer;
    parsed.push(currentblock);
  }

  return parsed;
}
