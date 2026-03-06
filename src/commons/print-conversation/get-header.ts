/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t } from '@zextras/carbonio-shell-ui';
import { filter } from 'lodash';
import moment from 'moment';

import { getUserLocale } from '../utils';
import { getAttachments } from 'commons/print-conversation/get-attachments';
import { getParticipantHeader } from 'commons/print-conversation/get-participant-header';
import { getSubject } from 'commons/print-conversation/get-subject';
import { MailMessage } from 'types/messages';

export function getHeader(msg: MailMessage, content: string): string {
	const { participants, subject } = msg;
	const from = filter(participants, { type: 'f' });
	const to = filter(participants, { type: 't' });
	const cc = filter(participants, { type: 'c' });
	const bcc = filter(participants, { type: 'b' });
	const replyTo = filter(participants, { type: 'r' });
	const msgTime = moment(msg.date).locale(getUserLocale()).format('llll');
	const hasAttachments = msg.attachments && msg.attachments?.length > 0;

	return `
    <table width="100%" cellpadding="0" cellspacing="0" class="Msg" style="padding:0.625rem;">
        <tr>
            <td  colspan="2">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EEEEEE;" >
                    <tr>
                        <td align="left">
                            <table width="100%" align="left" cellpadding="2" cellspacing="0" border="0">
                                ${getParticipantHeader(from, t('label.from', 'From'))}
                                ${getSubject(subject, t('label.subject', 'Subject'))}
                                ${getParticipantHeader(to, t('label.to', 'To'))} 
                                ${getParticipantHeader(cc, t('label.cc', 'Cc'))}
                                ${getParticipantHeader(bcc, t('label.bcc', 'Bcc'))}
                                ${getParticipantHeader(replyTo, t('label.reply_to', 'Reply To'))}
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
		  <tr>
      ${hasAttachments ? getAttachments({ msg }) : ''}

   </tr>
        <td id="iframeBody" style="padding:0.3125rem; font-family: monospace" valign='top' colspan="2">
            <div id="iframeBody" class="MsgBody-html">
                ${content}
            </div>
            <hr>
        </td>
    </tr>
</table>`;
}
