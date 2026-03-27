/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { escape, map } from 'lodash';

import { Participant } from 'types/participant';

export const getParticipantHeader = (participants: Participant[], type: string): string => {
	const participantsList = map(
		participants,
		(f) => `${escape(f.fullName || f.name || f.address)} <${escape(f.address)}> `
	).join(', ');

	if (participants.length === 0) return '';
	return `
    <tr>
   <td style="
      width: auto;
      padding: 0.1875rem 0 0.1875rem 0;
      vertical-align: top;
      text-align: left;
      font-weight: bold;
      ">${type}: <span style="padding: 0.1875rem 0.1875rem 0.1875rem 0.1875rem; vertical-align: top; overflow: hidden;font-family: Roboto, sans-serif;
      font-style: normal;
      font-weight: 400;
      font-size: 0.875rem;
      line-height: 1.3125rem;">${participantsList}</span></td>
</tr>

   `;
};
