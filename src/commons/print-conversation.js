/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach, reduce, map, filter, isEmpty } from 'lodash';
import moment from 'moment';

const _CI_REGEX = /^<(.*)>$/;
const _CI_SRC_REGEX = /^cid:(.*)$/;

const plainTextToHTML = (str) => {
	if (str !== undefined && str !== null) {
		return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
	}
	return '';
};
function findAttachments(parts, acc) {
	return reduce(
		parts,
		(found, part) => {
			if (part && (part.disposition === 'attachment' || part.disposition === 'inline') && part.ci) {
				found.push(part);
			}
			if (part.parts) return findAttachments(part.parts, found);
			return acc;
		},
		acc
	);
}

const getHeader = (msg, content) => {
	const { participants, subject } = msg;
	const from = filter(participants, { type: 'f' });
	const to = filter(participants, { type: 't' });
	const cc = filter(participants, { type: 'c' });
	const bcc = filter(participants, { type: 'b' });
	const replyTo = filter(participants, { type: 'r' });

	return `<table width="100%" cellpadding="0" cellspacing="0" class="Msg" style="padding:10px;">
    <tr>
        <td  colspan="2">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EEEEEE;" >
                <tr>
                    <td align="left">
                        <table width="100%" align="left" cellpadding="2" cellspacing="0" border="0">
                        <tr>
                        <td class='MsgHdrName'>
                            From:
                        </td>
                        <td class='MsgHdrValue'>
                            ${map(
															from,
															(f) => `${f.fullName || f.name || f.address} &lt; ${f.address} &gt; `
														).join(', ')}
                           </td>
                    </tr>
                    <tr>
                        <td class='MsgHdrName'>
                            Subject:
                        </td>
                        <td
                            class='MsgHdrValue'>${subject}</td>
                    </tr>
                    <tr>
                        <td class='MsgHdrName'>
                            To:
                        </td>
                        <td class='MsgHdrValue'>
                        ${map(
													to,
													(f) => `${f.fullName || f.name || f.address} &lt; ${f.address} &gt; `
												).join(', ')}
                            
                        </td>
                    </tr>
                       ${
													cc.length > 0
														? ` <tr>
                        <td class='MsgHdrName'>
                            Cc:
                        </td>
                        <td class='MsgHdrValue'>
                        ${map(
													cc,
													(f) => `${f.fullName || f.name || f.address} &lt; ${f.address} &gt; `
												).join(', ')}   
                        </td>
                    </tr>`
														: ''
												}
                  ${
										bcc.length > 0
											? `  <tr>
                        <td class='MsgHdrName'>
                            Bcc:
                        </td>
                        <td class='MsgHdrValue'>
                        ${map(
													bcc,
													(f) => `${f.fullName || f.name || f.address}&lt; ${f.address} &gt; `
												).join(', ')}   
                        </td>
                    </tr>`
											: ''
									}
                    <tr>
                   ${
											replyTo.length > 0
												? ` <td class='MsgHdrName'>
                        Reply To
                        :
                    </td>
                    <td class='MsgHdrValue'>
                    ${map(
											replyTo,
											(f) => `${f.fullName || f.name || f.address} &lt; ${f.address} &gt;`
										).join(', ')}   
                    </td>`
												: ''
										}
                </tr>
                            </table>
                    </td>
                    <td valign='top'>
                        <table width="100%" cellpadding="2" cellspacing="0" border="0">
                            <tr>
                                <td nowrap align='right' class='MsgHdrSent'>
                                    <span id="messageDisplayTime_19062">${moment(msg.date).format(
																			'ddd, MMM DD, YYYY hh:mm A'
																		)}</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
        <td id="iframeBody" style="padding:5px; font-family: monospace" valign='top' colspan="2">
            <div id="iframeBody" class="MsgBody-html">
                ${content}
            </div>
            <hr>
        </td>
    </tr>
</table>`;
};

export const getBodyWrapper = ({ content, subject }) => `<div className="ZhCallListPrintView">
			<table cellPadding="0" cellSpacing="5" width="100%">
				<tr style="background:rgba(176, 195, 231, 0.8)">
					<td>
						<div className="ZhPrintSubject">
							<b>${subject}</b>
						</div>
						<hr />
					</td>
				</tr>
				<tr>
					<td>${content}</td>
				</tr>
			</table>
		</div>`;

export const getContentForPrint = ({ messages, account, conversations, isMsg = false }) => {
	let content = '';
	map(conversations, (conv) => {
		const conversationMessage = isMsg ? messages : filter(messages, { conversation: conv.id });
		const ss = map(conversationMessage, (msg) => {
			const { body } = msg;
			switch (body.contentType) {
				case 'text/html': {
					const parts = findAttachments(msg.parts ?? [], []);
					const parser = new DOMParser();
					const htmlDoc = parser.parseFromString(body.content, 'text/html');
					const imgMap = reduce(
						parts,
						(r, v) => {
							if (!_CI_REGEX.test(v.ci)) return r;
							r[_CI_REGEX.exec(v.ci)[1]] = v;
							return r;
						},
						{}
					);

					const images = htmlDoc.getElementsByTagName('img');
					forEach(images, (p) => {
						if (p.hasAttribute('dfsrc')) {
							p.setAttribute('src', p.getAttribute('dfsrc'));
						}
						if (!_CI_SRC_REGEX.test(p.src)) return;
						const ci = _CI_SRC_REGEX.exec(p.getAttribute('src'))[1];
						if (imgMap[ci]) {
							const part = imgMap[ci];
							p.setAttribute('pnsrc', p.getAttribute('src'));
							p.setAttribute('src', `/service/home/~/?auth=co&id=${msg.id}&part=${part.name}`);
						}
					});

					return getHeader(msg, htmlDoc.body.innerHTML);
				}
				case 'text/plain': {
					return !isEmpty(body.content)
						? getHeader(msg, `<p>${plainTextToHTML(body.content)}</p>`)
						: getHeader(msg, '<p>No Content</p>');
				}
				default:
					return getHeader(msg, '<p>No Content</p>');
			}
		});
		content += getBodyWrapper({ content: ss.join('<br/>'), subject: conv.subject });
	});

	const finalContent = `<html>
        <head>
            <title>Carbonio</title>
            <style>
                max-width: 100% !important;
                body {
                    max-width: 100% !important;
                    margin: 0;
                    overflow-y: hidden;
                    font-family: Roboto, sans-serif;
                    font-size: 14px;
                    ${
											/* 
                        visibility: ${darkMode && darkMode !== 'disabled' ? 'hidden' : 'visible'}; 
                        */ ''
										}
                    background-color: #ffffff;
                }
                body pre, body pre * {
                    white-space: pre-wrap;
                    word-wrap: anywhere !important;
                    text-wrap: suppress !important;
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
                    font-family: Tahoma,Arial,Helvetica,sans-serif;
                    font-size: 12pt;
                }
                .ZhPrintSubject {
                    padding: 10px;
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
                    padding: 3px 0 3px 0;
                    vertical-align: top;
                    text-align: right;
                    font-weight: bold;
                    white-space: nowrap;
                }
                .MsgHdrValue {
                    padding: 3px 3px 3px 3px;
                    vertical-align: top;
                    overflow: hidden;
                }
                .footer {
                    font-size: 9px;
                    text-align: left;
                    padding-left: 20px;
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
    <table cellpadding="0" cellspacing="5"  width="100%">
	<tr>
		<td><b>Carbonio</b></td>
        <td nowrap width='1%'><b>${account?.name}</b></td>
	</tr>
</table>
<hr />
${content}

    <div class="footer">${window.location.hostname} </div>
    <script type="text/javascript">
            setTimeout('window.print()', 3000);
    </script>
    </body>
</html>`;

	return finalContent;
};
