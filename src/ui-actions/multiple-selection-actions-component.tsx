/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import {
	Button,
	Dropdown,
	DropdownItem,
	Padding,
	Row,
	Tooltip
} from '@zextras/carbonio-design-system';
import { isNil, noop } from 'lodash';

import { UIActionDescriptor } from '../types';

export const MultipleSelectionActionsComponent = ({
	actions
}: {
	actions: (DropdownItem | UIActionDescriptor)[];
}): React.JSX.Element => (
	<Row mainAlignment="flex-end" width="fit">
		{actions.map((action) => {
			if ('items' in action && !isNil(action.items) && action.icon) {
				return (
					<Padding key={action.id} right="small">
						<Tooltip label={action.label}>
							<Dropdown items={action.items.filter((item) => !item.disabled)}>
								<Button icon={action.icon} onClick={noop} size="large" type="ghost" />
							</Dropdown>
						</Tooltip>
					</Padding>
				);
			}
			if ('execute' in action && action.canExecute()) {
				return (
					<Tooltip key={action.id} label={action.label}>
						<Button
							key={action.id}
							icon={action.icon}
							onClick={action.execute}
							size="large"
							type="ghost"
						/>
					</Tooltip>
				);
			}
			return null;
		})}
	</Row>
);
