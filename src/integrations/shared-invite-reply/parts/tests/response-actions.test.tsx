/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { FOLDER_VIEW, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-ui-commons';
import { TFunction } from 'i18next';

import { screen, setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { CreateMountPointRequest } from 'api/mount-shared-folder-soap-api';
import ResponseActions from 'integrations/shared-invite-reply/parts/response-actions';
import { ResponseActionsProps } from 'types/share';

const t = ((key: string, defaultValue?: string): string =>
	defaultValue ?? key) as unknown as TFunction;

const buildProps = (props: Partial<ResponseActionsProps> = {}): ResponseActionsProps => ({
	t,
	zid: 'zid',
	view: FOLDER_VIEW.message,
	rid: 'rid',
	msgId: 'msgId',
	sharedFolderName: 'shared',
	grantee: 'grantee',
	owner: 'owner',
	role: 'role',
	allowedActions: 'r',
	participants: [],
	...props
});

const getCustomizeTrigger = (): HTMLElement =>
	screen.getByRoleWithIcon('button', { icon: 'icon: PlusCircleOutline' });

describe('ResponseActions', () => {
	it('should mount the shared folder with the picked color as rgb', async () => {
		const interceptor = createSoapAPIInterceptor<CreateMountPointRequest, never>(
			'CreateMountpoint'
		);
		const { user } = setupTest(<ResponseActions {...buildProps()} />);

		await user.click(screen.getByRole('button', { name: ZIMBRA_STANDARD_COLORS[3].zLabel }));
		await user.click(screen.getByRole('button', { name: /accept/i }));

		const { link } = await interceptor;
		expect(link.rgb).toBe(ZIMBRA_STANDARD_COLORS[3].hex);
		expect(link.color).toBeUndefined();
	});

	it('should preselect the first standard color', () => {
		setupTest(<ResponseActions {...buildProps()} />);

		expect(screen.getByRole('button', { name: ZIMBRA_STANDARD_COLORS[0].zLabel })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	it.each([
		[FOLDER_VIEW.message, 'Choose a color to make this folder easier to recognize'],
		[FOLDER_VIEW.appointment, 'Choose a color to make this calendar easier to recognize'],
		[FOLDER_VIEW.contact, 'Choose a color to make this address book easier to recognize']
	])('should show the color caption for the %s view', (view, caption) => {
		setupTest(<ResponseActions {...buildProps({ view })} />);

		expect(screen.getByText(caption)).toBeVisible();
	});

	it('should disable the other controls while the color picker is open', async () => {
		const { user } = setupTest(<ResponseActions {...buildProps()} />);

		await user.click(getCustomizeTrigger());

		expect(screen.getByRole('button', { name: /accept/i })).toBeDisabled();
		expect(screen.getByRole('button', { name: /decline/i })).toBeDisabled();
		expect(screen.getByRole('textbox', { name: /folder name/i })).toBeDisabled();
	});
});
