/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { RetentionPolicies } from '../retention-policies';

const defaultRetentionState = {
	showPolicy: true,
	dsblMsgDis: false,
	emptyDisValue: false,
	purgeValue: '',
	dspYear: 'd',
	dspRange: 'Days'
};

const defaultProps = {
	retentionState: defaultRetentionState,
	setRetentionState: jest.fn()
};
describe('RetentionPolicies Component', () => {
	it('renders the header and toggle button', () => {
		setupTest(<RetentionPolicies {...defaultProps} />);
		expect(screen.getByText('Retention policy')).toBeInTheDocument();
		expect(screen.getByTestId('retention_policy-icon')).toBeInTheDocument();
	});

	it('calls setRetentionState to toggle showPolicy', async () => {
		const { user } = setupTest(<RetentionPolicies {...defaultProps} />);
		const toggleButton = screen.getByTestId('retention_policy-icon');
		await user.click(toggleButton);
		expect(defaultProps.setRetentionState).toHaveBeenCalledWith({ showPolicy: false });
	});

	// it('calls setRetentionState when checkbox is toggled', async () => {
	// 	const setRetentionState = jest.fn();
	// 	const { user } = setupTest(
	// 		<RetentionPolicies
	// 			retentionState={{ ...defaultRetentionState, dsblMsgDis: false }}
	// 			setRetentionState={setRetentionState}
	// 		/>
	// 	);
	// 	await user.click(screen.getByTestId('enableMsgDisposal'));
	// 	expect(setRetentionState).toHaveBeenCalledWith({ dsblMsgDis: true });
	// });

	it('displays warning message when emptyDisValue is true', () => {
		setupTest(
			<RetentionPolicies
				retentionState={{ ...defaultRetentionState, emptyDisValue: true }}
				setRetentionState={jest.fn()}
			/>
		);
		expect(
			screen.getByText('The retention duration must be a positive number')
		).toBeInTheDocument();
	});

	it('does not render select dropdown when dspYear is null', () => {
		setupTest(
			<RetentionPolicies
				retentionState={{ ...defaultRetentionState, dspYear: null }}
				setRetentionState={jest.fn()}
			/>
		);
		expect(screen.queryByLabelText('Select')).not.toBeInTheDocument();
	});

	it('input should be disabled when dsblMsgDis is false', () => {
		setupTest(
			<RetentionPolicies
				retentionState={{ ...defaultRetentionState, dsblMsgDis: false }}
				setRetentionState={jest.fn()}
			/>
		);
		const input = screen.getByLabelText('Disposal Threshold');
		expect(input).toBeDisabled();
	});

	it('input should be enabled when dsblMsgDis is true', () => {
		setupTest(
			<RetentionPolicies
				retentionState={{ ...defaultRetentionState, dsblMsgDis: true }}
				setRetentionState={jest.fn()}
			/>
		);
		const input = screen.getByLabelText('Disposal Threshold');
		expect(input).toBeEnabled();
	});

	it('updates purgeValue when input is changed', async () => {
		const setRetentionState = jest.fn();
		const { user } = setupTest(
			<RetentionPolicies
				retentionState={{ ...defaultRetentionState, dsblMsgDis: true }}
				setRetentionState={setRetentionState}
			/>
		);
		screen.logTestingPlaygroundURL();
		const input = screen.getByRole('textbox', { name: /disposal threshold/i });
		// const input = screen.getByLabelText(/disposal threshold/i);
		expect(input).toBeEnabled();
		await user.type(input, '30');
		expect(setRetentionState).toHaveBeenLastCalledWith({ purgeValue: '30' });
	});

	// it('resets emptyDisValue when typing into the input', async () => {
	// 	const setRetentionState = jest.fn();
	// 	const { user } = setupTest(
	// 		<RetentionPolicies
	// 			retentionState={{
	// 				...defaultRetentionState,
	// 				dsblMsgDis: true,
	// 				emptyDisValue: true
	// 			}}
	// 			setRetentionState={setRetentionState}
	// 		/>
	// 	);
	// 	const input = screen.getByRole('textbox', { name: /disposal threshold/i });
	// 	await user.type(input, '5');
	// 	expect(setRetentionState).toHaveBeenCalledWith({ emptyDisValue: false });
	// 	expect(setRetentionState).toHaveBeenLastCalledWith({ purgeValue: '5' });
	// });

	it('shows the correct selected value in the select dropdown', () => {
		setupTest(
			<RetentionPolicies
				retentionState={{ ...defaultRetentionState, dsblMsgDis: true }}
				setRetentionState={jest.fn()}
			/>
		);
		expect(screen.getByText(/days/i)).toBeVisible();
	});

	// it('calls setRetentionState when selecting a new retention period', async () => {
	// 	const setRetentionState = jest.fn();
	// 	const { user } = setupTest(
	// 		<RetentionPolicies
	// 			retentionState={{ ...defaultRetentionState, dsblMsgDis: true }}
	// 			setRetentionState={setRetentionState}
	// 		/>
	// 	);

	// 	await user.click(screen.getByText(/days/i));
	// 	await user.click(screen.getByText(/years/i));

	// 	expect(setRetentionState).toHaveBeenCalledWith({
	// 		dspYear: 'y',
	// 		dspRange: 'Years'
	// 	});
	// });
});
