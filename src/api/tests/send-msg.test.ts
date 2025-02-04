/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@testing-library/react';

import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { getConvEmailStoreAction } from '../../store/emails/actions/get-conv-action';
import { getMessageEmailStoreAction } from '../../store/emails/actions/get-message';
import { getMessageWithExistingParticipantsEmailStoreAction } from '../../store/emails/actions/get-message-with-existing-participants';
import { generateMessage } from '../../tests/generators/generateMessage';
import { sendMsg } from '../send-msg';

jest.mock('../../store/emails/actions/get-conv-action', () => ({
	getConvEmailStoreAction: jest.fn()
}));

jest.mock('../../store/emails/actions/get-message', () => ({
	getMessageEmailStoreAction: jest.fn(),
	getMessageWithExistingParticipantsEmailStoreAction: jest.fn()
}));

describe('sendMsg', () => {
	it('should send a message and trigger store actions on success', async () => {
		const msg = generateMessage({ id: '1' });

		const interceptor = createSoapAPIInterceptor('SendMsg', { m: [{ id: '1', cid: '123' }] });

		await sendMsg({ msg });
		const request = await interceptor;

		expect(request).toEqual(expect.objectContaining({ m: expect.objectContaining({ id: '1' }) }));
		await waitFor(async () => {
			expect(getConvEmailStoreAction).toHaveBeenCalledWith({ id: '123' });
		});
		expect(getMessageWithExistingParticipantsEmailStoreAction).toHaveBeenCalledWith(
			'1', // messageId
			expect.arrayContaining([expect.any(Object)]) // participants
		);
	});

	it('should skip store actions if response does not include id or cid', async () => {
		const msg = generateMessage({ id: '1' });

		const interceptor = createSoapAPIInterceptor('SendMsg', { m: [] });

		await sendMsg({ msg });
		const request = await interceptor;

		expect(request).toEqual(expect.objectContaining({ m: expect.objectContaining({ id: '1' }) }));
		await waitFor(async () => {
			expect(getConvEmailStoreAction).not.toHaveBeenCalled();
		});
		expect(getMessageEmailStoreAction).not.toHaveBeenCalled();
	});

	it('should return the response received from the api call', async () => {
		const msg = generateMessage({ id: '1' });
		const response = { m: [{ id: '1', cid: '123' }] };
		createSoapAPIInterceptor('SendMsg', response);

		const result = await sendMsg({ msg });

		expect(result).toEqual(response);
	});
});
