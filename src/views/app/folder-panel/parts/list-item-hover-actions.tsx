/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback } from 'react';

import { Button, Tooltip } from '@zextras/carbonio-design-system';

import { UIActionDescriptor } from '../../../../types';

const ListItemHoverAction = ({ action }: { action: UIActionDescriptor }): ReactElement => {
	const onClick = useCallback(
		(ev: any): void => {
			if (ev) {
				ev.preventDefault();
			}
			action.execute();
		},
		[action]
	);
	return (
		<Tooltip label={action.label}>
			<Button
				key={action.id}
				icon={action.icon}
				onClick={onClick}
				size="small"
				type="ghost"
				color="text"
			/>
		</Tooltip>
	);
};

export const ListItemHoverActions = ({
	actions
}: {
	actions: UIActionDescriptor[];
}): React.JSX.Element => (
	<>
		{actions
			.filter((action) => action.canExecute())
			.map((action, index) => (
				<ListItemHoverAction key={action.id ?? index} action={action} />
			))}
	</>
);
