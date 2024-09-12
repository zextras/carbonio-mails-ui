/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';

import { Button, Dropdown, Tooltip } from '@zextras/carbonio-design-system';

import { HoverBarContainer } from './hover-bar-container';
import { HoverContainer } from './hover-container';
import { MessageActionsDescriptors } from '../../../../constants';
import { isConversation } from '../../../../helpers/messages';
import { UIActionDescriptor } from '../../../../hooks/actions/use-redirect-msg';
import { useMessageActions } from '../../../../hooks/use-message-actions';
import type { ListItemActionWrapperProps, MessageAction } from '../../../../types';
import { useMsgConvActions } from '../../../../ui-actions/use-msg-conv-actions';

const HoverActionComponent = ({ action }: { action: UIActionDescriptor }): ReactElement => {
	const onClick = useCallback(
		(ev): void => {
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

export const ListItemActionWrapper: FC<ListItemActionWrapperProps> = ({
	children,
	onClick,
	onDoubleClick,
	item,
	active,
	deselectAll,
	hoverActions
}) => {
	const messageActionsForExtraWindow = useMessageActions({
		message: isConversation(item) ? undefined : item,
		isAlone: true,
		isForExtraWindow: true
	});

	const [_hoverActions, dropdownActions] = useMsgConvActions({
		item,
		deselectAll,
		messageActionsForExtraWindow
	});
	const finalDropdownActions = dropdownActions.filter(
		(action: MessageAction) => action.id !== MessageActionsDescriptors.CREATE_APPOINTMENT.id
	);

	const dropdownActionsItems = finalDropdownActions.map((action) => ({
		...action,
		onClick: (ev: KeyboardEvent | React.SyntheticEvent<HTMLElement, Event>): void => {
			action.onClick && action.onClick(ev);
		},
		label: 'label' in action ? action.label : ''
	}));

	const hoverActionsComponent = useMemo(
		() =>
			hoverActions
				.filter((action) => action.canExecute())
				.map((action, index) => <HoverActionComponent key={action.id ?? index} action={action} />),
		[hoverActions]
	);

	return (
		<Dropdown
			contextMenu
			items={dropdownActionsItems}
			display="block"
			style={{ width: '100%', height: '4rem' }}
			data-testid={`secondary-actions-menu-${item.id}`}
		>
			<HoverContainer
				data-testid={`hover-container-${item.id}`}
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="unset"
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				$hoverBackground={active ? 'highlight' : 'gray6'}
			>
				{children}
				<HoverBarContainer
					orientation="horizontal"
					mainAlignment="flex-end"
					crossAlignment="center"
					background={active ? 'highlight' : 'gray6'}
					data-testid={`primary-actions-bar-${item.id}`}
				>
					{hoverActionsComponent}
				</HoverBarContainer>
			</HoverContainer>
		</Dropdown>
	);
};
