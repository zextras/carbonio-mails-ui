/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const getCompleteHTMLForEML = ({ content }: { content: string }): string => `
<html>
   <head>
      <title>Carbonio</title>
      <style>                   
         body {
         max-width: 100% !important;
         margin: 0;
         overflow-y: auto;
         font-family: Roboto, sans-serif !important;
         font-size: 0.875rem;                      
         background-color: #ffffff;
         }
         body pre, body pre * {
         white-space: pre-wrap;
         word-wrap: anywhere !important;                      
         }
         img {
         max-width: 100%
         }
         tbody{position:relative !important}
         td{
         max-width: 100% !important;
         overflow-wrap: anywhere !important;
         }
         .ZhCallListPrintView td, .zPrintMsgs :not(font){
         font-family: Roboto, sans-serif ;
         font-size: 12pt;
         }
         .ZhPrintSubject {
         padding: 0.625rem;
         font-weight: bold;
         }
         table.Msg img {
         max-width: 100%;
         }
         /* span, p td or div will honour parent's styling if these elements have their own styling that will get applied else will fallback to defaultPrintFontSize */
         *[style*="font"] > span, *[style*="font"] > p, *[style*="font"] > td, *[style*="font"] > div {
         font-family: inherit;
         font-size: inherit;
         }
         .MsgHdrName {
         width: 10%;
         padding: 0.1875rem 0 0.1875rem 0;
         vertical-align: top;
         text-align: right;
         font-weight: bold;
         white-space: nowrap;
         }
         .MsgHdrValue {
         padding: 0.1875rem 0.1875rem 0.1875rem 0.1875rem;
         vertical-align: top;
         overflow: hidden;
         }
         .footer {
         font-size: 0.5625rem;
         text-align: left;
         padding-left: 1.25rem;
         }
         @page {
         size: A4;
         margin: 11mm 17mm 17mm 17mm;
         }
         @media print {
         .footer {
         position: fixed;
         bottom: 0;
         }
         .content-block, p {
         page-break-inside: avoid;
         }
         html, body {
         width: 210mm;
         height: 297mm;
         }
         }
      </style>
   </head>
   <body>
      ${content}
      <div class="footer">${window.location.hostname} </div>
   </body>
</html>
`;
