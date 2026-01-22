/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { useTheme } from '@zextras/carbonio-design-system';

import { SubjectText } from '../subject-text';
import { setupHook, setupTest } from '@test-setup';

describe('Subject Text', () => {
	it('will display the subject if subject is available', () => {
		setupTest(<SubjectText read={false} subject={'subject'} />);
		expect(screen.getByText('subject')).toBeVisible();
	});
	it('will display <No Subject> if subject is not available', () => {
		setupTest(<SubjectText read={false} subject={''} />);
		expect(screen.getByText('<No Subject>')).toBeVisible();
	});
	it('will show bold text when read is false', () => {
		const {
			result: { current: theme }
		} = setupHook(useTheme);
		setupTest(<SubjectText read={false} subject={'subject'} />);
		expect(screen.getByText('subject')).toHaveStyle({
			'font-weight': theme.fonts.weight.bold
		});
	});
	it('will show regular text when read is true', () => {
		const {
			result: { current: theme }
		} = setupHook(useTheme);
		setupTest(<SubjectText read subject={'subject'} />);
		expect(screen.getByText('subject')).toHaveStyle({
			'font-weight': theme.fonts.weight.regular
		});
	});
	it('will show regular color when subject is available', () => {
		const {
			result: { current: theme }
		} = setupHook(useTheme);
		setupTest(<SubjectText read={false} subject={'subject'} />);
		expect(screen.getByText('subject')).toHaveStyle({
			color: theme.palette.text.regular
		});
	});
	it('will show secondary color when subject is empty', () => {
		const {
			result: { current: theme }
		} = setupHook(useTheme);
		setupTest(<SubjectText read={false} subject={''} />);
		expect(screen.getByTestId('Subject')).toHaveStyle({
			color: theme.palette.secondary.regular
		});
	});
});
