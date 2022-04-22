/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getBridgedFunctions } from '@zextras/carbonio-shell-ui';
import { forEach, pick, merge, omit, reduce, map, filter, sortBy, reverse } from 'lodash';
import sound from '../../assets/notification.mp3';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import { IncompleteMessage } from '../../types/mail-message';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { SoapIncompleteMessage } from '../../types/soap';
import { MsgStateType } from '../../types/state';
import { showNotification } from '../../views/notifications';

type Payload = {
	payload: {
		t: any;
		m: SoapIncompleteMessage;
	};
};

function playSound(): void {
	const audio = new Audio(sound);
	audio.play();
}

const triggerNotification = (m: SoapIncompleteMessage): void => {
	const { t } = getBridgedFunctions();
	const messages = map(m, (item) => {
		let norm = normalizeMailMessageFromSoap(item, false);
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		if (norm?.fragment?.length < 1) {
			norm = {
				...norm,
				fragment: t('notification.no_content', 'Message without content')
			};
		}
		if (norm?.subject?.length < 1) {
			norm = {
				...norm,
				subject: t('notification.new_message', 'New Message')
			};
		}
		return pick(norm, ['subject', 'fragment', 'date', 'parent', 'isSentByMe']);
	});
	const messagesToNotify = reverse(
		sortBy(
			filter(messages, (item) => !(item.isSentByMe === true)),
			'date'
		)
	);

	messagesToNotify?.length > 0 && playSound();

	forEach(messagesToNotify, (msg) => {
		if (msg.parent !== '5') {
			showNotification(
				msg.subject,
				msg.fragment ?? t('notification.no_content', 'Message without content')
			);
		}
	});
};

export const handleCreatedMessagesReducer = (state: MsgStateType, { payload }: Payload): void => {
	const { m } = payload;
	const mappedMsgs = <IncompleteMessage>reduce(
		m,
		(acc, v) => {
			const msg = normalizeMailMessageFromSoap(v, false);
			return { ...acc, [msg.id]: msg };
		},
		{}
	);
	triggerNotification(m);
	state.messages = merge(state.messages, mappedMsgs);
};

export const handleModifiedMessagesReducer = (state: MsgStateType, { payload }: Payload): void => {
	forEach(payload, (msg) => {
		if (msg?.id && state?.messages?.[msg.id]) {
			state.messages[msg.id] = { ...merge(state.messages[msg.id], msg), tags: msg.tags };
		}
	});
};

export const handleDeletedMessagesReducer = (state: MsgStateType, { payload }: Payload): void => {
	forEach(payload, (id) => {
		state.messages = omit(state.messages, id);
	});
};
