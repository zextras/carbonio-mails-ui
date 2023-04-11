/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	Container,
	Dropdown,
	DropdownItem,
	IconButton,
	Tooltip
} from '@zextras/carbonio-design-system';
import { useTags, useUserAccount } from '@zextras/carbonio-shell-ui';
import React, { FC, useCallback, useMemo } from 'react';
import styled, { DefaultTheme } from 'styled-components';
import { useAppDispatch } from '../../../../hooks/redux';
import { ListItemActionWrapperProps, MailMessage } from '../../../../types';
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

export type ActionObj = DropdownItem & {
	icon: NonNullable<DropdownItem['icon']>;
	onClick: NonNullable<DropdownItem['onClick']>;
};

type ActionList = Array<ActionObj>;

type GetMsgActionsFunction = (item: MailMessage, closeEditor: boolean) => [ActionList, ActionList];

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

	const msgConvActionsCallback = useMemo(
		() =>
			getMsgConvActions({
				item,
				dispatch,
				account,
				tags,
				deselectAll
			}),
		[account, deselectAll, dispatch, item, tags]
	);

	const getMsgConvHoverActions = useCallback<GetMsgActionsFunction>(
		(_item: MailMessage, closeEditor: boolean): [ActionList, ActionList] =>
			// TODO fix me
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			msgConvActionsCallback(item, closeEditor),
		[item, msgConvActionsCallback]
	);
	const [hoverActions, dropdownActions] = useMemo(
		// TODO fix me
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		() => getMsgConvHoverActions({ item, dispatch, deselectAll, account, tags }, false),
		[account, deselectAll, dispatch, getMsgConvHoverActions, item, tags]
	);

	return (
		<Dropdown
			contextMenu
			items={dropdownActions}
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
						<Tooltip key={action.id ?? index} label={action.label}>
							<IconButton
								key={action.id}
								icon={action.icon}
								onClick={(ev): void => {
									ev.stopPropagation();
									action.onClick(ev);
								}}
								size="small"
							/>
						</Tooltip>
					))}
				</HoverBarContainer>
			</HoverContainer>
		</Dropdown>
	);
};
