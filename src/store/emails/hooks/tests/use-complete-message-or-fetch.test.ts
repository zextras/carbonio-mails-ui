/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { act, renderHook, waitFor } from '@testing-library/react';

import { generateCompleteMessageFromAPI } from '../../../../__test__/generators/api';
import { generateMessage } from '../../../../__test__/generators/generateMessage';
import * as getMsg from '../../../../api/get-msg-soap-api';
import { API_REQUEST_STATUS, DEFAULT_API_DEBOUNCE_TIME } from '../../../../constants';
import { GetMsgRequest, GetMsgResponse } from '../../../../types';
import {
	setMessagesInEmailStore,
	setSearchResultsByMessage,
	updateMessageStatus,
	useMessageStatus
} from '../../store';
import { useCompleteMessageOrFetch } from '../use-complete-message-or-fetch';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';

function awaitDebounce(): void {
	act(() => {
		jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
	});
}

describe('useCompleteMessageOrFetch', () => {
	it('should fetch if message is not in the store', async () => {
		const response: GetMsgResponse = {
			m: [generateCompleteMessageFromAPI({ id: '1' })]
		};

		const interceptor = createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', response);

		renderHook(() => useCompleteMessageOrFetch('1'));

		act(() => {
			jest.advanceTimersByTime(DEFAULT_API_DEBOUNCE_TIME);
		});

		const getMsgRequest = await interceptor;

		await act(async () => {
			expect(getMsgRequest).toMatchObject({ m: expect.objectContaining({ id: '1' }) });
		});
	});

	it('should fetch if the message is not complete', async () => {
		const message = generateMessage({ id: '1' });
		setMessagesInEmailStore([{ ...message, isComplete: false }], false);
		const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
		renderHook(() => useCompleteMessageOrFetch('1'));

		awaitDebounce();

		await act(async () => {
			expect(getMsgSpy).toHaveBeenCalled();
		});
	});

	it('should not fetch if the message is complete and messageStatus is fulfilled', async () => {
		const message = generateMessage({ id: '1' });
		await act(async () => {
			setMessagesInEmailStore([{ ...message, isComplete: true }], false);
		});

		await act(async () => {
			updateMessageStatus(message.id, API_REQUEST_STATUS.fulfilled);
		});
		const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => {
			renderHook(() => useCompleteMessageOrFetch(message.id));
		});

		expect(getMsgSpy).not.toHaveBeenCalled();
	});

	it('should fetch if the messageStatus is undefined', async () => {
		const message = generateMessage({ id: '1' });
		await act(async () => {
			setMessagesInEmailStore([{ ...message, isComplete: true }], false);
		});

		await act(async () => {
			updateMessageStatus(message.id, undefined as never);
		});
		const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');

		// eslint-disable-next-line testing-library/no-unnecessary-act
		await act(async () => {
			renderHook(() => useCompleteMessageOrFetch(message.id));
		});

		awaitDebounce();

		await waitFor(async () => {
			expect(getMsgSpy).toHaveBeenCalledTimes(1);
		});
	});

	it('should fetch if the message is incomplete and status is error', async () => {
		const message = generateMessage({ id: '1' });
		setMessagesInEmailStore([{ ...message, isComplete: false }], false);
		updateMessageStatus('1', API_REQUEST_STATUS.error);
		const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
		renderHook(() => useCompleteMessageOrFetch('1'));

		awaitDebounce();

		await act(async () => {
			expect(getMsgSpy).toHaveBeenCalled();
		});
	});

	it('should not fetch if the message status is pending', async () => {
		const message = generateMessage({ id: '1' });
		setMessagesInEmailStore([{ ...message, isComplete: false }], false);
		await act(async () => {
			updateMessageStatus('1', API_REQUEST_STATUS.pending);
		});
		const { result } = renderHook(() => useMessageStatus('1'));
		expect(result.current).toBe(API_REQUEST_STATUS.pending);
		const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
		renderHook(() => useCompleteMessageOrFetch('1'));

		await act(async () => {
			expect(getMsgSpy).not.toHaveBeenCalled();
		});
	});

	it('should fetch a new message if messageId changes', async () => {
		const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
		const { rerender } = renderHook(({ id }) => useCompleteMessageOrFetch(id), {
			initialProps: { id: '1' }
		});

		awaitDebounce();

		await act(async () => {
			expect(getMsgSpy).toHaveBeenCalledTimes(1);
		});

		await waitFor(async () => {
			// eslint-disable-next-line testing-library/no-wait-for-side-effects
			rerender({ id: '2' });
		});

		awaitDebounce();

		await act(async () => {
			expect(getMsgSpy).toHaveBeenCalledTimes(2);
		});
	});

	it('should update status if initial status is undefined', async () => {
		const message = generateMessage({
			id: '1',
			subject: 'Test Message'
		});
		setSearchResultsByMessage([message], false);
		await act(async () => {
			updateMessageStatus(message.id, undefined as never);
		});

		const response: GetMsgResponse = {
			m: [generateCompleteMessageFromAPI({ id: message.id })]
		};

		createSoapAPIInterceptor<GetMsgRequest, GetMsgResponse>('GetMsg', response);

		const { result } = renderHook(() => useMessageStatus(message.id));
		renderHook(() => useCompleteMessageOrFetch(message.id));

		await waitFor(() => {
			expect(result.current).toBe(API_REQUEST_STATUS.fulfilled);
		});
	});

	describe('Auto-mark-as-read functionality', () => {
		it('should pass read=true when fetching unread message and user setting allows it', async () => {
			const message = { ...generateMessage({ id: '1' }), read: false };
			setMessagesInEmailStore([{ ...message, isComplete: false }], false);

			const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
			renderHook(() => useCompleteMessageOrFetch('1'));

			awaitDebounce();

			await waitFor(() => {
				expect(getMsgSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						msgId: '1',
						read: true
					})
				);
			});
		});

		it('should pass read=false when fetching already-read message', async () => {
			const message = { ...generateMessage({ id: '1' }), read: true };
			setMessagesInEmailStore([{ ...message, isComplete: false }], false);

			const getMsgSpy = jest.spyOn(getMsg, 'getMsgSoapApi');
			renderHook(() => useCompleteMessageOrFetch('1'));

			awaitDebounce();

			await waitFor(() => {
				expect(getMsgSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						msgId: '1',
						read: false
					})
				);
			});
		});
	});
});
