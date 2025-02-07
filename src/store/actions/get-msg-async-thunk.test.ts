/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	getMsgCall,
	getFullMsgCall,
	getMsgAsyncThunk,
	getFullMsgAsyncThunk
} from './get-msg-async-thunk';
import { getMsgSoapApi } from '../../api/get-msg-soap-api';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import type { MailMessage } from '../../types';

jest.mock('../../api/get-msg-soap-api');
jest.mock('../../normalizations/normalize-message');

describe('get-msg-async-thunk', () => {
	const mockMailMessage = { id: 'test-id' } as MailMessage;
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('getMsgCall', () => {
		it('should call getMsgSoapApi and normalizeMailMessageFromSoap', async () => {
			(getMsgSoapApi as jest.Mock).mockResolvedValue({ m: [mockMailMessage] });
			(normalizeMailMessageFromSoap as jest.Mock).mockReturnValue(mockMailMessage);

			const result = await getMsgCall({ msgId: 'test-id' });
			expect(getMsgSoapApi).toHaveBeenCalledWith({
				msgId: 'test-id',
				max: 250000,
				smimePassword: undefined
			});
			expect(normalizeMailMessageFromSoap).toHaveBeenCalledWith(mockMailMessage, true);
			expect(result).toEqual(mockMailMessage);
		});
	});

	describe('getFullMsgCall', () => {
		it('should call getMsgSoapApi and normalizeMailMessageFromSoap', async () => {
			(getMsgSoapApi as jest.Mock).mockResolvedValue({ m: [mockMailMessage] });
			(normalizeMailMessageFromSoap as jest.Mock).mockReturnValue(mockMailMessage);

			const result = await getFullMsgCall({ msgId: 'test-id' });
			expect(getMsgSoapApi).toHaveBeenCalledWith({ msgId: 'test-id' });
			expect(normalizeMailMessageFromSoap).toHaveBeenCalledWith(mockMailMessage, true);
			expect(result).toEqual(mockMailMessage);
		});
	});

	describe('getMsgAsyncThunk', () => {
		it('should dispatch the thunk and return the normalized message', async () => {
			(getMsgSoapApi as jest.Mock).mockResolvedValue({ m: [mockMailMessage] });
			(normalizeMailMessageFromSoap as jest.Mock).mockReturnValue(mockMailMessage);

			const dispatch = jest.fn();
			const getState = jest.fn();
			const extra = {};
			const arg = { msgId: 'test-id' };
			const thunk = getMsgAsyncThunk(arg);
			const result = await thunk(dispatch, getState, extra);
			expect(result.payload).toEqual(mockMailMessage);
		});
	});

	describe('getFullMsgAsyncThunk', () => {
		it('should dispatch the thunk and return the normalized message', async () => {
			(getMsgSoapApi as jest.Mock).mockResolvedValue({ m: [mockMailMessage] });
			(normalizeMailMessageFromSoap as jest.Mock).mockReturnValue(mockMailMessage);

			const dispatch = jest.fn();
			const getState = jest.fn();
			const extra = {};
			const arg = { msgId: 'test-id' };
			const thunk = getFullMsgAsyncThunk(arg);
			const result = await thunk(dispatch, getState, extra);
			expect(result.payload).toEqual(mockMailMessage);
		});
	});
});
