/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter, forEach, isEmpty, map, reduce } from 'lodash';
import moment from 'moment';
import {
	findAttachments,
	plainTextToHTML,
	_CI_REGEX,
	_CI_SRC_REGEX
} from './mail-message-renderer';

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
