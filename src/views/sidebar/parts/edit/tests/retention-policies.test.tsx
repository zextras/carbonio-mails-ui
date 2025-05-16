/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { RetentionPolicies } from '../retention-policies';

const defaultProps = {
	showPolicy: true,
	setShowPolicy: jest.fn(),
	dsblMsgDis: false,
	setDsblMsgDis: jest.fn(),
	emptyDisValue: false,
	setEmptyDisValue: jest.fn(),
	purgeValue: '',
	setPurgeValue: jest.fn(),
	retentionPeriod: [
		{ label: 'Days', value: 'd' },
		{ label: 'Weeks', value: 'w' }
	],
	dspYear: 'd',
	setDspYear: jest.fn(),
	dspRange: 'Days'
};

describe('RetentionPolicies Component', () => {
	it('renders the header and toggle button', () => {
		setupTest(<RetentionPolicies {...defaultProps} />);
		expect(screen.getByText('Retention policy')).toBeInTheDocument();
		expect(screen.getByTestId('retention_policy-icon')).toBeInTheDocument();
	});

	it('calls setShowPolicy when toggle button is clicked', async () => {
		const { user } = setupTest(<RetentionPolicies {...defaultProps} />);
		const toggleButton = screen.getByTestId('retention_policy-icon');
		await user.click(toggleButton);
		expect(defaultProps.setShowPolicy).toHaveBeenCalledWith(!defaultProps.showPolicy);
	});

	// it('toggles disposal checkbox and resets empty value flag', async () => {
	// 	const { user } = setupTest(<RetentionPolicies {...defaultProps} emptyDisValue />);
	// 	const checkbox = screen.getByTestId('enableMsgDisposal');
	// 	await user.click(checkbox);
	// 	expect(defaultProps.setEmptyDisValue).toHaveBeenCalledWith(false);
	// 	expect(defaultProps.setDsblMsgDis).toHaveBeenCalledWith(true);
	// });

	// it('updates input value when changed', async () => {
	// 	const setEmptyDisValue = jest.fn();
	// 	const setPurgeValue = jest.fn();

	// 	const { user } = setupTest(
	// 		<RetentionPolicies
	// 			{...defaultProps}
	// 			emptyDisValue
	// 			setEmptyDisValue={setEmptyDisValue}
	// 			setPurgeValue={setPurgeValue}
	// 		/>
	// 	);
	// 	const toggleButton = screen.getByTestId('retention_policy-icon');
	// 	await user.click(toggleButton);
	// 	const enableMsgDisposal = screen.getByTestId('enableMsgDisposal');
	// 	console.clear();
	// 	screen.logTestingPlaygroundURL();
	// 	await user.click(enableMsgDisposal);
	// 	const input = screen.getByRole('textbox', { name: /disposal threshold/i });
	// 	// console.log(input);
	// 	await user.clear(input); // optional
	// 	await user.type(input, '10');

	// 	expect(setEmptyDisValue).toHaveBeenCalledWith(false);
	// 	expect(setPurgeValue).toHaveBeenCalledWith('10');
	// });

	it('displays warning message when emptyDisValue is true', () => {
		setupTest(<RetentionPolicies {...defaultProps} emptyDisValue />);
		expect(
			screen.getByText('The retention duration must be a positive number')
		).toBeInTheDocument();
	});

	it('does not render select dropdown when dspYear is null', () => {
		setupTest(<RetentionPolicies {...defaultProps} dspYear={null} />);
		expect(screen.queryByLabelText('Select')).not.toBeInTheDocument();
	});

	it('input should be disabled when dsblMsgDis is false', () => {
		setupTest(<RetentionPolicies {...defaultProps} dsblMsgDis={false} />);
		const input = screen.getByLabelText('Disposal Threshold');
		expect(input).toBeDisabled();
	});

	it('input should be enabled when dsblMsgDis is true', () => {
		setupTest(<RetentionPolicies {...defaultProps} dsblMsgDis />);
		const input = screen.getByLabelText('Disposal Threshold');
		expect(input).toBeEnabled();
	});
});
