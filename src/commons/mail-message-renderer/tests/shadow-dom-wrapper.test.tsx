/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ShadowDomWrapper } from '../shadow-dom-wrapper';

test('ShadowDomWrapper renders correctly in open mode', () => {
	const { container } = render(
		<ShadowDomWrapper>
			<span>Test Content</span>
		</ShadowDomWrapper>
	);

	// eslint-disable-next-line testing-library/no-node-access,testing-library/no-container
	const shadowRoot = container.querySelector('div')?.shadowRoot;
	expect(shadowRoot).not.toBeNull();
	expect(shadowRoot?.innerHTML).toContain('Test Content');
});
