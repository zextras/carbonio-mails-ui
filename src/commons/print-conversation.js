/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach, reduce, map, filter, isEmpty } from 'lodash';
import moment from 'moment';
import {
	plainTextToHTML,
	findAttachments,
	_CI_REGEX,
	_CI_SRC_REGEX
} from './mail-message-renderer';
import logo from '../assets/zextras-logo-gray.png';
import productLogo from '../assets/logo-product-grey.png';

export const getCompleteHTML = ({ content, account }) =>
	`	<html>
		<head>
			<title>Carbonio</title>
                <style>
                    max-width: 100% !important;
                    body {
                        max-width: 100% !important;
                        margin: 0;
                        overflow-y: hidden;
                        font-family: Roboto, sans-serif;
                        font-size: 0.875rem;                      
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
			<table cellPadding="0" cellSpacing="5" width="100%">
				<tr>
					<td>
						<b>Carbonio</b>
					</td>
					<td nowrap width="1%">
						<b>${account?.name}</b>
					</td>
				</tr>
			</table>
			<hr />${content}
			<div className="footer">${window.location.hostname} </div>
			<script type="text/javascript">setTimeout('window.print()', 3000);</script>
		</body>
	</html>`;

const getParticipantHeader = (participants, type) => {
	const participantsList = map(
		participants,
		(f) => `${f.fullName || f.name || f.address} < ${f.address} > `
	).join(', ');

	if (participants.length === 0) return '';
	return `<tr>
			<td style="
                width: 10%;
                padding: 0.1875rem 0 0.1875rem 0;
                vertical-align: top;
                text-align: right;
                font-weight: bold;
                white-space: nowrap;
            ">${type}:</td>
			<td className="MsgHdrValue"
             style="padding: 0.1875rem 0.1875rem 0.1875rem 0.1875rem; vertical-align: top; overflow: hidden; ">
                ${participantsList}
             </td>
		</tr>`;
};

const getHeader = (msg, content) => {
	const { participants, subject } = msg;
	const from = filter(participants, { type: 'f' });
	const to = filter(participants, { type: 't' });
	const cc = filter(participants, { type: 'c' });
	const bcc = filter(participants, { type: 'b' });
	const replyTo = filter(participants, { type: 'r' });
	const msgTime = moment(msg.date).format('ddd, MMM DD, YYYY hh:mm A');
	return `
    <table width="100%" cellpadding="0" cellspacing="0" class="Msg" style="padding:0.625rem;">
        <tr>
            <td  colspan="2">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EEEEEE;" >
                    <tr>
                        <td align="left">
                            <table width="100%" align="left" cellpadding="2" cellspacing="0" border="0">
                                ${getParticipantHeader(from, 'From')}
                                <tr>
                                    <td class='MsgHdrName'> Subject: </td>
                                    <td  class='MsgHdrValue'>${subject}</td>
                                </tr>
                                ${getParticipantHeader(to, 'To')} 
                                ${getParticipantHeader(cc, 'Cc')}
                                ${getParticipantHeader(bcc, 'Bcc')}
                                ${getParticipantHeader(replyTo, 'Reply To')}
                        </table>
                        </td>
                        <td valign='top'>
                            <table width="100%" cellpadding="2" cellspacing="0" border="0">
                                <tr>
                                    <td nowrap align='right' class='MsgHdrSent'>
                                        <span id="messageDisplayTime_19062">${msgTime}</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <td id="iframeBody" style="padding:0.3125rem; font-family: monospace" valign='top' colspan="2">
            <div id="iframeBody" class="MsgBody-html">
                ${content}
            </div>
            <hr>
        </td>
    </tr>
</table>`;
};

export const getBodyWrapper = ({ content, subject }) => `
        <div className="ZhCallListPrintView">
			<table cellPadding="0" cellSpacing="5" width="100%">
				<tr>
					<td>
						<div className="ZhPrintSubject" 
                        style="background: rgba(176, 195, 231, 0.8);height: 1.75rem;
                        padding-left: 0.25rem;
                        display: flex;
                        align-items: center;">
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

	return getCompleteHTML({ content, account });
};

export const getErrorPage = (t) =>
	`<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>${t('label.error', 'Error')}</title>
        <style>
            html, body, .container {
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            body {
                background-color: #ffffff;
                color: #4d4d4d;
                font-size: 0.8125rem;
                font-family: Roboto, sans-serif;
            }
            .container {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            .mainTextWrapper {
                color: #2b73d2;
                font-weight: 900;
                font-size: 1.625rem;
                line-height: 1.5rem;
                margin-top: 1.875rem;
            }
            .errorWrapper {
                display: flex;
                flex-direction: row;
                align-items: center;
                margin: 1.4375rem 0 0.625rem;
            }
            .line {
                height: 0.0625rem;
                width: 6.25rem;
                background-color: gray;
            }
            .errorCode {
                color: #4d4d4d;
                font-weight: 300;
                font-size: 0.875rem;
                line-height: 1.3125rem;
                padding: 0 3.125rem;
                text-transform: uppercase;
            }
            .customText {
                margin: 0 0.3125rem 0 0;
                color: #414141;
            }
            .needSupportText {
                color: #414141;
                font-size: 0.9375rem;
            }
            .poweredByZextras {
                display: flex;
                margin: 1.875rem 0 0 0;
            }
            .zextrasLogo {
                top: 0.1875rem;
                position: relative;
            }
            .productLogo {
                height: 4.6875rem;
                width: 35.25rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="productLogo" >
                <img src=${productLogo} width="564" height="75"/>
            </div>
            <div class="mainTextWrapper">
            ${t('messages.could_not_find_to_show', 'Sorry, we couldn’t find anything to show')}
            </div>
            <div class="errorWrapper">
                <div class="line"></div>
                <div class="errorCode"><p>${t(
									'messages.something_went_wrong',
									'SOMETHING WENT WRONG'
								)}</p></div>
                <div class="line"></div>
            </div>
            <p class="needSupportText">${t(
							'messages.check_and_try_again',
							'Please, check Carbonio and try again'
						)}</p>
            <div class="poweredByZextras">
                <p class="customText">${t('messages.powered_by', 'powered by')}</p>
                <div class="zextrasLogo">
                    <img src=${logo} height="10" width="63"/>
                </div>
            </div>
        </div>
    </body>
</html>`;
