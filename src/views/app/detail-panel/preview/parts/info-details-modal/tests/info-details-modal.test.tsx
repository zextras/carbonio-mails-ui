/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../../../carbonio-ui-commons/test/test-setup';
import { getMsgAsyncThunk } from '../../../../../../../store/actions';
import { selectMessage } from '../../../../../../../store/messages-slice';
import { generateStore } from '../../../../../../../tests/generators/store';
import { MailInfoDetailModal } from '../mail-info-detail-modal';

describe('Mail Info Detail Modal', () => {
	test(`Should correctly render all parts`, async () => {
		const onClose = jest.fn();
		const store = generateStore();

		await store.dispatch<any>(getMsgAsyncThunk({ msgId: '15' }));
		const state = store.getState();
		const msg = selectMessage(state, '15');
		setupTest(
			<MailInfoDetailModal
				onClose={onClose}
				signature={msg.signature?.[0]}
				messageIdFromMailHeaders={'messageId'}
				creationDateFromMailHeaders={'creationDate'}
				mailAuthenticationHeaders={{
					dkim: { value: 'dkimvalue', pass: true },
					spf: { value: 'spfvalue', pass: true },
					dmarc: { value: 'dmarcvalue', pass: true }
				}}
				messageIsFromDistributionList
				messageIsFromExternalDomain
				sensitivityValue={'Private'}
			/>,
			{ store }
		);
		expect(screen.getByText('Message details')).toBeVisible();
		expect(screen.getByText('General Information')).toBeVisible();
		expect(screen.getByText('Message ID:')).toBeVisible();
		expect(screen.getByText('messageId')).toBeVisible();
		expect(screen.getByText('Created at:')).toBeVisible();
		expect(screen.getByText('creationDate')).toBeVisible();
		expect(screen.getByText('Sensitivity:')).toBeVisible();
		expect(screen.getByText('Private')).toBeVisible();
		expect(screen.getByText('This email is from a Distribution List')).toBeVisible();
		expect(screen.getByText('This email is from an External Domain')).toBeVisible();
		expect(screen.getByText('Authentication Headers')).toBeVisible();
		expect(screen.getByText('DKIM:')).toBeVisible();
		expect(screen.getByText('DMARC:')).toBeVisible();
		expect(screen.getByText('SPF:')).toBeVisible();
		expect(screen.getByText('dkimvalue')).toBeVisible();
		expect(screen.getByText('spfvalue')).toBeVisible();
		expect(screen.getByText('dmarcvalue')).toBeVisible();
		expect(screen.getByText(`Issuer's Certificate Not Found`)).toBeVisible();
		expect(
			screen.getByText(
				'This message includes a digital signature, but the certificate of the issuing authority could not be found.'
			)
		).toBeVisible();
		expect(screen.getByText('Validity:')).toBeVisible();
		expect(screen.getByText('Close')).toBeVisible();
	});
});
