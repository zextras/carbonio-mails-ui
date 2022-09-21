/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { forEach, reduce, map, filter, isEmpty } from 'lodash';
import moment from 'moment';
import { TFunction } from 'i18next';
import {
	plainTextToHTML,
	findAttachments,
	_CI_REGEX,
	_CI_SRC_REGEX
} from './mail-message-renderer';
import logo from '../assets/zextras-logo-gray.png';
import productLogo from '../assets/logo-product-grey.png';
import { getAvatarLabel } from './useGetAvatarLabel';
import { Conversation, MailMessage, Participant } from '../types';

const getParticipantHeader = (participants: Participant[], type: string): string => {
	const participantsList = map(
		participants,
		(f) => `${f.fullName || f.name || f.address} < ${f.address} > `
	).join(', ');

	if (participants.length === 0) return '';
	return `<tr>
			<td style="
                width: auto;
                padding: 3px 0 3px 0;
                vertical-align: top;
                text-align: left;
                font-weight: bold;
                white-space: nowrap;
            ">${type}: <span style="padding: 3px 3px 3px 3px; vertical-align: top; overflow: hidden; color: #828282;font-family: Roboto;
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            line-height: 21px;">${participantsList}</span></td>
			
		</tr>`;
};

export const getBodyWrapper = ({
	content,
	subject
}: {
	content: string;
	subject: string;
}): string => {
	const style = `background: white;font-family: Roboto;font-style: normal; font-weight: 400;  font-size: 18px;
    line-height: 27px;`;

	return `
    <div className="ZhCallListPrintView">
        <table cellPadding="0" cellSpacing="5" width="100%">
            <tr>
                <td>
                    <div className="ZhPrintSubject" 
                    style="${style} height: 28px;padding-left: 4px;display: flex;align-items: center;">
                        <b>${subject}</b>
                    </div>                  
                </td>
            </tr>
            <tr>
                <td>${content}</td>
            </tr>
        </table>
    </div>`;
};

export const getErrorPage = (t: TFunction): string =>
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
                font-size: 13px;
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
                font-size: 26px;
                line-height: 24px;
                margin-top: 30px;
            }
            .errorWrapper {
                display: flex;
                flex-direction: row;
                align-items: center;
                margin: 23px 0 10px;
            }
            .line {
                height: 1px;
                width: 100px;
                background-color: gray;
            }
            .errorCode {
                color: #4d4d4d;
                font-weight: 300;
                font-size: 14px;
                line-height: 21px;
                padding: 0 50px;
                text-transform: uppercase;
            }
            .customText {
                margin: 0 5px 0 0;
                color: #414141;
            }
            .needSupportText {
                color: #414141;
                font-size: 15px;
            }
            .poweredByZextras {
                display: flex;
                margin: 30px 0 0 0;
            }
            .zextrasLogo {
                top: 3px;
                position: relative;
            }
            .productLogo {
                height: 75px;
                width: 564px;
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

export const getCompleteHTMLForEML = ({ content }: { content: string }): string =>
	`	<html>
		<head>
			<title>Carbonio</title>
                <style>
                    max-width: 100% !important;
                    body {
                        max-width: 100% !important;
                        margin: 0;
                        overflow-y: hidden;
                        font-family: Roboto, sans-serif !important;
                        font-size: 14px;                      
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
                        font-family: Roboto, sans-serif ;
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
			${content}
			<div className="footer">${window.location.hostname} </div>			
		</body>
	</html>`;

const getEMLHeader = (msg: MailMessage, content: string): string => {
	const { participants } = msg;
	const from = filter(participants, { type: 'f' });
	const to = filter(participants, { type: 't' });
	const cc = filter(participants, { type: 'c' });
	const bcc = filter(participants, { type: 'b' });
	const replyTo = filter(participants, { type: 'r' });
	const msgTime = moment(msg.date).format('ddd, MMM DD, YYYY hh:mm A');

	return `
    <table width="100%" cellpadding="0" cellspacing="0" class="Msg" style="padding:10px;">
        <tr>
      
            <td  colspan="2">
                <table width="100%" cellpadding="10" cellspacing="0" border="0"  >
                    <tr>
                    <td style="width:50px;"> 
                    <div style="width:48px;height:48px;border-radius:50%;background:skyblue;margin-left:10px;">
                          <p style="text-align:center;line-height:50px">
                          ${getAvatarLabel(from?.[0]?.fullName ?? from?.[0]?.address)}
                          </p>
                    </div>
                   </td>
                        <td align="left">
                            <table width="100%" align="left" cellpadding="2" cellspacing="0" border="0">
                                ${getParticipantHeader(from, 'From')}                            
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
        <td id="iframeBody" style="padding:5px; font-family: Roboto, sans-serif ;" valign='top' colspan="2">
            <div id="iframeBody" class="MsgBody-html">
            <hr />
                ${content}
            </div>
            <hr>
        </td>
    </tr>
</table>`;
};

type GetEMLContentProps = {
	messages: MailMessage[];
	conversations: Array<{ conversation: string; subject: string }>;
	isMsg?: boolean;
};

export const getEMLContent = ({
	messages,
	conversations,
	isMsg = false
}: GetEMLContentProps): string => {
	let content = '';
	map(conversations, (conv) => {
		const conversationMessage = isMsg
			? messages
			: filter(messages, { conversation: conv.conversation });
		const ss = map(conversationMessage, (msg: MailMessage) => {
			const { body } = msg;
			switch (body.contentType) {
				case 'text/html': {
					const parts = findAttachments(msg.parts ?? [], []);
					const parser = new DOMParser();
					const htmlDoc = parser.parseFromString(body.content, 'text/html');
					const imgMap = reduce(
						parts,
						(r, v) => {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							if (!_CI_REGEX.test(v.ci)) return r;
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							r[_CI_REGEX.exec(v.ci)[1]] = v;
							return r;
						},
						{}
					);

					const images = htmlDoc.getElementsByTagName('img');
					forEach(images, (p) => {
						if (p.hasAttribute('dfsrc')) {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							p.setAttribute('src', p.getAttribute('dfsrc'));
						}
						if (!_CI_SRC_REGEX.test(p.src)) return;
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						const ci = _CI_SRC_REGEX.exec(p.getAttribute('src'))[1];
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						if (imgMap[ci]) {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							const part = imgMap[ci];
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							p.setAttribute('pnsrc', p.getAttribute('src'));
							p.setAttribute('src', `/service/home/~/?auth=co&id=${msg.id}&part=${part.name}`);
						}
					});

					return getEMLHeader(msg, htmlDoc.body.innerHTML);
				}
				case 'text/plain': {
					return !isEmpty(body.content)
						? getEMLHeader(msg, `<p>${plainTextToHTML(body.content)}</p>`)
						: getEMLHeader(msg, '<p>No Content</p>');
				}
				default:
					return getEMLHeader(msg, '<p>No Content</p>');
			}
		});
		content += getBodyWrapper({
			content: ss.join('<br/>'),
			subject: messages?.[0]?.subject
		});
	});

	return getCompleteHTMLForEML({ content });
};
