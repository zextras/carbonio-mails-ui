/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, within } from '@testing-library/react';
import { times } from 'lodash';

import { FOLDER_VIEW } from '../../carbonio-ui-commons/constants';
import { ParticipantRole } from '../../carbonio-ui-commons/constants/participants';
import { createFakeIdentity } from '../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../carbonio-ui-commons/test/mocks/store/folders';
import { setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../constants';
import { generateMessage } from '../../tests/generators/generateMessage';
import { generateStore } from '../../tests/generators/store';
import { RedirectMessageActionRequest } from '../../types';
import RedirectMessageAction from '../redirect-message-action';

describe('RedirectMessageAction', () => {
	it('should enable the "redirect" button when at least one recipient address is set', async () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });
		const msg = generateMessage({});
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: { [msg.id]: msg },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});

		const component = <RedirectMessageAction id={msg.id} onClose={jest.fn()} />;
		const { user } = setupTest(component, { store });

		const recipient = createFakeIdentity().email;
		const title = screen.getByText(/Redirect e-mail/i);

		const recipientsInputElement = within(
			screen.getByTestId('redirect-recipients-address')
		).getByRole('textbox');
		await user.click(recipientsInputElement);
		await user.clear(recipientsInputElement);
		await user.type(recipientsInputElement, recipient);
		await user.click(title);

		const button = screen.getByRole('button', {
			name: /redirect/i
		});

		expect(button).toBeEnabled();
	});

	it('should call the API for one recipients', async () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });
		const msg = generateMessage({});
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: { [msg.id]: msg },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});
		const interceptor = createSoapAPIInterceptor<RedirectMessageActionRequest>('BounceMsg');

		const component = <RedirectMessageAction id={msg.id} onClose={jest.fn()} />;
		const { user } = setupTest(component, { store });
		const recipient = createFakeIdentity().email;
		const recipientsInputElement = within(
			screen.getByTestId('redirect-recipients-address')
		).getByRole('textbox');

		await user.type(recipientsInputElement, recipient);
		const button = screen.getByRole('button', {
			name: /redirect/i
		});
		await act(async () => {
			await user.click(button);
		});

		const requestParameter = await interceptor;

		expect(requestParameter.m.id).toBe(msg.id);
		expect(requestParameter.m.e).toHaveLength(1);
		expect(requestParameter.m.e[0].t).toBe(ParticipantRole.TO);
		expect(requestParameter.m.e[0].a).toBe(recipient);
	});

	it('should call the API for 5 recipients', async () => {
		populateFoldersStore({ view: FOLDER_VIEW.message });
		const msg = generateMessage({});
		const store = generateStore({
			messages: {
				searchedInFolder: {},
				messages: { [msg.id]: msg },
				searchRequestStatus: API_REQUEST_STATUS.fulfilled
			}
		});
		const interceptor = createSoapAPIInterceptor<RedirectMessageActionRequest>('BounceMsg');

		const component = <RedirectMessageAction id={msg.id} onClose={jest.fn()} />;
		const { user } = setupTest(component, { store });
		const recipients = times(5, () => createFakeIdentity().email);
		const recipientsInputElement = within(
			screen.getByTestId('redirect-recipients-address')
		).getByRole('textbox');
		const title = screen.getByText(/Redirect e-mail/i);

		await user.type(recipientsInputElement, recipients[0]);
		await user.click(title);
		await user.type(recipientsInputElement, recipients[1]);
		await user.click(title);
		await user.type(recipientsInputElement, recipients[2]);
		await user.click(title);
		await user.type(recipientsInputElement, recipients[3]);
		await user.click(title);
		await user.type(recipientsInputElement, recipients[4]);
		await user.click(title);

		const button = screen.getByRole('button', {
			name: /redirect/i
		});
		expect(button).toBeEnabled();
		await act(async () => {
			await user.click(button);
		});
		const requestParameter = await interceptor;

		expect(requestParameter.m.id).toBe(msg.id);
		expect(requestParameter.m.e).toHaveLength(recipients.length);
		requestParameter.m.e.forEach((participant) => {
			expect(participant.t).toBe(ParticipantRole.TO);
			expect(recipients).toContain(participant.a);
		});
	});
});
