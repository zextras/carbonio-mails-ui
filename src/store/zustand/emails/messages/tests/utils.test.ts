/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import produce from 'immer';
import { UseBoundStore, StoreApi } from 'zustand';

import { API_REQUEST_STATUS } from '../../../../../constants';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import { EmailsStoreState, MailMessage } from '../../../../../types';
import { CONVERSATIONS_INDEX_SLICE_INITIAL_STATE } from '../../conversations/conversations-index-slice';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from '../../populated-items/populated-items-slice';
import { SEARCH_INDEX_SLICE_INITIAL_STATE } from '../../search/search-slice';
import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from '../messages-slice';
import { messageIndexSliceUtils } from '../utils';

describe('setMessages', () => {
	let useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>;
	let setStateMock: jest.Mock;

	beforeEach(() => {
		setStateMock = jest.fn();
		useEmailsStore = {
			setState: setStateMock
		} as unknown as UseBoundStore<StoreApi<EmailsStoreState>>;
	});

	it('should set messages and update store state', () => {
		const message1 = generateMessage({ id: '1' });
		const message2 = generateMessage({ id: '2' });
		const messages: Array<MailMessage> = [message1, message2];
		const more = true;

		messageIndexSliceUtils.setMessages(messages, more, useEmailsStore);

		expect(setStateMock).toHaveBeenCalledWith(expect.any(Function));

		const stateUpdater = setStateMock.mock.calls[0][0];

		const initialState: EmailsStoreState = {
			messageIndexSlice: MESSAGE_INDEX_SLICE_INITIAL_STATE,
			populatedItemsSlice: POPULATED_ITEMS_SLICE_INITIAL_STATE,
			searchIndexSlice: SEARCH_INDEX_SLICE_INITIAL_STATE,
			conversationsIndexSlice: CONVERSATIONS_INDEX_SLICE_INITIAL_STATE
		};

		const newState = produce(initialState, stateUpdater);

		expect(newState.messageIndexSlice.messageIdSet).toEqual(new Set(['1', '2']));
		expect(newState.messageIndexSlice.status).toBe(API_REQUEST_STATUS.fulfilled);
		expect(newState.messageIndexSlice.offset).toBe(0);
		expect(newState.messageIndexSlice.more).toBe(true);
		expect(newState.populatedItemsSlice.messages).toEqual({
			'1': message1,
			'2': message2
		});
	});
});
