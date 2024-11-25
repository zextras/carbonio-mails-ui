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

describe('MailInfoDetailModal', () => {
	it(`Should correctly render all parts`, async () => {
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
				// authenticationMailsHeaders={{
				// 	dkim: { value: 'dkimvalue', pass: true },
				// 	spf: { value: 'spfvalue', pass: true },
				// 	dmarc: { value: 'dmarcvalue', pass: true }
				// }}
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

		// expect(screen.getByText('Authentication Headers')).toBeVisible();
		// expect(screen.getByText('DKIM:')).toBeVisible();
		// expect(screen.getByText('DMARC:')).toBeVisible();
		// expect(screen.getByText('SPF:')).toBeVisible();
		// expect(screen.getByText('dkimvalue')).toBeVisible();
		// expect(screen.getByText('spfvalue')).toBeVisible();
		// expect(screen.getByText('dmarcvalue')).toBeVisible();

		expect(screen.getByText(`Issuer's Certificate Not Found`)).toBeVisible();
		expect(
			screen.getByText(
				'This message includes a digital signature, but the certificate of the issuing authority could not be found.'
			)
		).toBeVisible();
		expect(screen.getByText('Validity:')).toBeVisible();

		expect(screen.getByText('Close')).toBeVisible();
	});

	it(`Should not render undefined, but render other`, async () => {
		const onClose = jest.fn();
		const store = generateStore();

		await store.dispatch<any>(getMsgAsyncThunk({ msgId: '15' }));
		const state = store.getState();
		const msg = selectMessage(state, '15');
		setupTest(
			<MailInfoDetailModal
				onClose={onClose}
				signature={msg.signature?.[0]}
				messageIdFromMailHeaders={undefined}
				creationDateFromMailHeaders={undefined}
				// authenticationMailsHeaders={{
				// 	dkim: { value: 'dkimvalue', pass: true },
				// 	spf: { value: 'spfvalue', pass: true },
				// 	dmarc: { value: 'dmarcvalue', pass: true }
				// }}
				messageIsFromDistributionList
				messageIsFromExternalDomain
				sensitivityValue={'Private'}
			/>,
			{ store }
		);
		expect(screen.getByText('Message details')).toBeVisible();

		expect(screen.getByText('General Information')).toBeVisible();
		expect(screen.queryByText('Message ID:')).not.toBeInTheDocument();
		expect(screen.queryByText('messageId')).not.toBeInTheDocument();
		expect(screen.queryByText('Created at:')).not.toBeInTheDocument();
		expect(screen.queryByText('creationDate')).not.toBeInTheDocument();
		expect(screen.getByText('Sensitivity:')).toBeVisible();
		expect(screen.getByText('Private')).toBeVisible();

		expect(screen.getByText('This email is from a Distribution List')).toBeVisible();

		expect(screen.getByText('This email is from an External Domain')).toBeVisible();

		// expect(screen.getByText('Authentication Headers')).toBeVisible();
		// expect(screen.getByText('DKIM:')).toBeVisible();
		// expect(screen.getByText('DMARC:')).toBeVisible();
		// expect(screen.getByText('SPF:')).toBeVisible();
		// expect(screen.getByText('dkimvalue')).toBeVisible();
		// expect(screen.getByText('spfvalue')).toBeVisible();
		// expect(screen.getByText('dmarcvalue')).toBeVisible();

		expect(screen.getByText(`Issuer's Certificate Not Found`)).toBeVisible();
		expect(
			screen.getByText(
				'This message includes a digital signature, but the certificate of the issuing authority could not be found.'
			)
		).toBeVisible();
		expect(screen.getByText('Validity:')).toBeVisible();

		expect(screen.getByText('Close')).toBeVisible();
	});

	it(`Should render empty modal dialog if no valid metadata to show`, async () => {
		const onClose = jest.fn();
		setupTest(
			<MailInfoDetailModal
				onClose={onClose}
				signature={undefined}
				messageIdFromMailHeaders={undefined}
				creationDateFromMailHeaders={undefined}
				// authenticationMailsHeaders={undefined}
				messageIsFromDistributionList={undefined}
				messageIsFromExternalDomain={undefined}
				sensitivityValue={undefined}
			/>
		);

		expect(screen.getByText('Message details')).toBeVisible();
		expect(screen.queryByText('General Information')).not.toBeInTheDocument();
		// expect(screen.queryByText('Authentication Headers')).not.toBeInTheDocument();
		expect(screen.queryByText(`Issuer's Certificate Not Found`)).not.toBeInTheDocument();
		expect(screen.getByText('Close')).toBeVisible();
	});

	// test(`Should show authentication header subsection if authentication header is an empty object`, async () => {
	// 	const onClose = jest.fn();
	// 	setupTest(<MailInfoDetailModal onClose={onClose} authenticationMailsHeaders={{}} />);
	//
	// 	expect(screen.getByText('Message details')).toBeVisible();
	// 	expect(screen.getByText('Authentication Headers')).toBeInTheDocument();
	// 	expect(screen.getAllByText('Missing')).toHaveLength(3);
	// 	expect(screen.getByText('Close')).toBeVisible();
	// });
});
