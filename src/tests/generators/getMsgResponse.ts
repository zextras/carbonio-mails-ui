/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { faker } from '@faker-js/faker';
import { FOLDERS, SoapResponse } from '@zextras/carbonio-shell-ui';

import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import type { GetMsgResponse, Participant, SoapMailParticipant } from '../../types';

/**
 *
 * @param date
 */
const toUnixTimestamp = (date: Date): number => Math.floor(date.getTime() / 1000);

/**
 * Convert a Participant into a SoapMailParticipant
 * @param participant
 */
const toSoapMailParticipant = (participant: Participant): SoapMailParticipant => ({
	a: participant.address,
	d: participant.name,
	p: participant.fullName ?? '',
	t: participant.type
});

/**
 *
 */
type GetMsgResponseGenerationParams = {
	id?: string;
	folder?: string;
	from?: Participant;
	to?: Array<Participant>;
	cc?: Array<Participant>;
	sendDate?: number;
	receiveDate?: number;
	subject?: string;
	body?: string;
};

/**
 *
 * @param id
 * @param folder
 * @param sendDate
 * @param receiveDate
 * @param participants
 * @param subject
 * @param body
 */
const generateGetMsgResponse = ({
	id = faker.number.int().toString(),
	folder = FOLDERS.INBOX,
	sendDate = toUnixTimestamp(faker.date.recent({ days: 2 })),
	receiveDate = toUnixTimestamp(faker.date.recent({ days: 1 })),
	to = [{ type: ParticipantRole.TO, address: faker.internet.email() }],
	cc = [],
	from = { type: ParticipantRole.FROM, address: faker.internet.email() },
	subject = faker.lorem.word(6),
	body = faker.lorem.paragraph(4)
}: GetMsgResponseGenerationParams): SoapResponse<GetMsgResponse> => {
	const result: SoapResponse<GetMsgResponse> = {
		Header: {
			context: {
				session: { id: 165483, _content: 165483 },
				change: { token: 15977 }
			}
		},
		Body: {
			GetMsgResponse: {
				m: [
					{
						s: 37393,
						d: receiveDate,
						l: folder,
						cid: '7579',
						rev: 15963,
						id,
						fr: body?.substring(0, 40),
						e: [
							toSoapMailParticipant(from),
							...to.map((participant) => toSoapMailParticipant(participant)),
							...cc.map((participant) => toSoapMailParticipant(participant))
						],
						su: subject,
						mid: '\u003C280337d8-9219-462b-94e1-9501fa19b6ff@foo.net\u003E',
						sd: sendDate,
						mp: [
							{
								part: 'TEXT',
								ct: 'multipart/alternative',
								mp: [
									{ part: '1', ct: 'text/plain', s: body?.length },
									{
										part: '2',
										ct: 'text/html',
										s: body?.length,
										body: true,
										content: body
									}
								]
							}
						]
					}
				]
			}
		}
	};

	return result;
};

export { GetMsgResponseGenerationParams, generateGetMsgResponse };
