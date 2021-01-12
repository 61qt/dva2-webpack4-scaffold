export default function (htmlContent) {
  return `
  <!Doctype html>
  <html>
    <head>
      <title>内容预览</title>
      <style>
        html,body{
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: auto;
          background-color: #f1f2f3;
        }
        .container{
          box-sizing: border-box;
          width: 1000px;
          max-width: 850px;
          min-height: 100%;
          margin: 0 auto;
          padding: 30px 20px;
          overflow: hidden;
          background-color: #fff;
          border-right: solid 1px #eee;
          border-left: solid 1px #eee;
        }
        .container img,
        .container audio,
        .container video{
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>
        <div class="container">${htmlContent}</div>
    </body>
  </html>
  `;
}
