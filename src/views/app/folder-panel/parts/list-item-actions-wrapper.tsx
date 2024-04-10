/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, SyntheticEvent, useCallback } from 'react';

import { Container, Dropdown, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import styled, { DefaultTheme } from 'styled-components';

import { MessageActionsDescriptors } from '../../../../constants';
import { isConversation } from '../../../../helpers/messages';
import { useMessageActions } from '../../../../hooks/use-message-actions';
import type {
	ConvActionReturnType,
	Conversation,
	ListItemActionWrapperProps,
	MailMessage,
	MessageAction,
	MessageActionReturnType,
	TagActionItemType
} from '../../../../types';
import { useMsgConvActions } from '../../../../ui-actions/use-msg-conv-actions';

const HoverBarContainer = styled(Container)<{ background: keyof DefaultTheme['palette'] }>`
	top: 0;
	right: 0;
	display: none;
	position: absolute;
	background: linear-gradient(
		to right,
		transparent,
		${({ background, theme }): string => theme.palette[background].hover}
	);
	width: calc(100% - 4rem);
	height: 45%;

	& > * {
		margin-top: ${({ theme }): string => theme.sizes.padding.small};
		margin-right: ${({ theme }): string => theme.sizes.padding.small};
	}
`;

const HoverContainer = styled(Container).attrs(() => ({
	background: 'transparent'
}))<{ $hoverBackground: keyof DefaultTheme['palette'] }>`
	width: 100%;
	position: relative;
	cursor: pointer;
	text-decoration: none;

	&:hover {
		background: ${({ $hoverBackground, theme }): string => theme.palette[$hoverBackground].hover};

		& ${HoverBarContainer} {
			display: flex;
		}
	}
`;

const HoverActionComponent = ({
	action
}: {
	action: MessageActionReturnType | ConvActionReturnType | TagActionItemType;
	item: Conversation | MailMessage;
}): ReactElement => {
	const label = 'label' in action ? action.label : '';
	const icon = 'icon' in action ? action.icon : '';
	const onClick = useCallback(
		(ev?: KeyboardEvent | SyntheticEvent<HTMLElement, Event>): void => {
			ev?.stopPropagation();
			action.onClick && action.onClick(ev);
		},
		[action]
	);
	return (
		<Tooltip label={label}>
			<IconButton key={action.id} icon={icon} onClick={onClick} size="small" />
		</Tooltip>
	);
};

export const ListItemActionWrapper: FC<ListItemActionWrapperProps> = ({
	children,
	onClick,
	onDoubleClick,
	item,
	active,
	deselectAll
}) => {
	const messageActions = useMessageActions(isConversation(item) ? undefined : item, true);

	const [hoverActions, dropdownActions] = useMsgConvActions({
		item,
		deselectAll,
		messageActionsForExtraWindow: messageActions
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
					{hoverActions.map((action, index) => (
						<HoverActionComponent key={action.id ?? index} action={action} item={item} />
					))}
				</HoverBarContainer>
			</HoverContainer>
		</Dropdown>
	);
};
