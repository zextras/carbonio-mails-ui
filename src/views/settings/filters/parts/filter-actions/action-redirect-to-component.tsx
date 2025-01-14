/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useCallback } from 'react';

import { v4 as uuidv4 } from 'uuid';

import { RedirectTo } from './redirect-to';
import { CONTACT_TYPES } from '../../../../../carbonio-ui-commons/integrations/constants';
import { ContactInputItem } from '../../../../../carbonio-ui-commons/integrations/types';
import { FilterAction, FilterRedirect } from '../../../../../types';

type ActionRedirectToComponentProps = {
	value: FilterRedirect;
	onChange: (filterValue: FilterAction) => void;
};
export const ActionRedirectToComponent = ({
	value,
	onChange
}: ActionRedirectToComponentProps): React.JSX.Element => {
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
