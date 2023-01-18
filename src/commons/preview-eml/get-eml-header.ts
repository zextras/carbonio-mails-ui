/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { filter } from 'lodash';
import moment from 'moment';
import { DefaultTheme } from 'styled-components';
import { MailMessage } from '../../types';
import { getAvatarLabel } from '../useGetAvatarLabel';
import { banner } from './banner';
import { getActionsRow } from './get-actions-row';
import { getAttachments } from './get-attachments';
import { getParticipantHeader } from './get-participant-header';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';

export type getEmailHeaderProps = {
	msg: MailMessage;
	content: string;
	theme: DefaultTheme;
};

export const getEmlHeader = ({ msg, content, theme }: getEmailHeaderProps): string => {
	const { participants } = msg;
	const from = filter(participants, { type: ParticipantRole.FROM });
	const to = filter(participants, { type: ParticipantRole.TO });
	const cc = filter(participants, { type: ParticipantRole.CARBON_COPY });
	const bcc = filter(participants, { type: ParticipantRole.BLIND_CARBON_COPY });
	const replyTo = filter(participants, { type: ParticipantRole.REPLY_TO });
	const msgTime = moment(msg.date).format('ddd, MMM DD, YYYY hh:mm A');
	const hasAttachments = msg.attachments && msg.attachments?.length > 0;
	return `
    <table  "class="Msg" style="padding:0.625rem;width:100%;">
   <tr>
      <td  colspan="2">
         <table style="padding:0.625rem;width:100%;"    >
            <tr>
               <td style="width:3.125rem;vertical-align:top">
                  <div style="
                           font-family: Roboto, sans-serif;
                           width:3rem;
                           height:3rem;
                           border-radius:50%;
                           background:skyblue;
                           margin: 0 1rem 0 0;
                           ">
                     <p style="text-align:center;line-height:3.125rem;margin-top:0.25rem">
                        ${getAvatarLabel(from?.[0]?.fullName ?? from?.[0]?.address)}
                     </p>
                  </div>
               </td>
               <td  style="text-align:left;">
                  <table style="text-align:left;width:100%;" >
                     ${getParticipantHeader(from, 'From')}                            
                     ${getParticipantHeader(to, 'To')} 
                     ${getParticipantHeader(cc, 'Cc')}
                     ${getParticipantHeader(bcc, 'Bcc')}
                     ${getParticipantHeader(replyTo, 'Reply To')}
                  </table>
               </td>
               <td style="vertical-align: text-top;">
                  <table  style="padding:0.3125rem;width:100%;"  >
                     <tr>
                        <td nowrap style="text-align:right;" class='MsgHdrSent'>
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
      ${hasAttachments ? banner : ''}
      ${hasAttachments ? getAttachments({ msg, theme }) : ''}
      ${hasAttachments ? getActionsRow({ msg }) : ''}

   </tr>
   <td id="iframeBody" style="padding:0.3125rem; font-family: Roboto, sans-serif, sans-serif ;" colspan="2">
      <div id="iframeBody" class="MsgBody-html">
         <hr />
         ${content}
      </div>
      <hr>
   </td>
   </tr>
</table>
`;
};
