/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Dropdown, IconButton, Tooltip } from '@zextras/carbonio-design-system';
import { useTags, useUserAccount } from '@zextras/carbonio-shell-ui';
import React, { FC, ReactElement, SyntheticEvent, useCallback } from 'react';
import styled, { DefaultTheme } from 'styled-components';
import { useAppDispatch } from '../../../../hooks/redux';
import {
	ConvActionReturnType,
	Conversation,
	ListItemActionWrapperProps,
	MailMessage,
	MessageActionReturnType,
	TagActionItemType
} from '../../../../types';
import { getMsgConvActions } from '../../../../ui-actions/get-msg-conv-actions';

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
	action,
	item
}: {
	action: MessageActionReturnType | ConvActionReturnType | TagActionItemType;
	item: Conversation | MailMessage;
}): ReactElement => {
	const label = 'label' in action ? action.label : '';
	const icon = 'icon' in action ? action.icon : '';
	const onClick = useCallback(
		(ev: SyntheticEvent<Element, Event> | KeyboardEvent): void => {
			ev.stopPropagation();
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
	const dispatch = useAppDispatch();
	const account = useUserAccount();
	const tags = useTags();

	const [hoverActions, dropdownActions] = getMsgConvActions({
		item,
		dispatch,
		deselectAll,
		account,
		tags
	});

	const dropdownActionsItems = dropdownActions.map((action) => ({
		...action,
		onClick: (ev: SyntheticEvent<Element, Event> | KeyboardEvent): void => {
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
