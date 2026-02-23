/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { CONTACT_TYPES, ContactInputItem } from '@zextras/carbonio-ui-commons';
import { v4 as uuidv4 } from 'uuid';

import { RedirectTo } from 'views/settings/filters/parts/filter-actions/redirect-to';
import { ActionComponentProps } from 'views/settings/filters/types';
import { FilterRedirect } from 'types/filters';

export const ActionRedirectToComponent = ({
	value,
	onChange
}: ActionComponentProps<FilterRedirect>): React.JSX.Element => {
	const onRedirectToChange = useCallback(
		(users: ContactInputItem[]): void => {
			const email = users?.length > 0 ? users[0].value.email : '';
			onChange({
				actionRedirect: [{ a: email }],
				id: uuidv4()
			});
		},
		[onChange]
	);
	const email = value.actionRedirect[0].a;
	const contacts = email
		? [
				{
					id: email,
					label: email,
					value: { id: email, email, type: CONTACT_TYPES.CONTACT }
				}
			]
		: [];

	return <RedirectTo defaultValue={contacts} onChange={onRedirectToChange} />;
};
