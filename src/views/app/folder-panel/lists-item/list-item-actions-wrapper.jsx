/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useContext, useMemo } from 'react';
import { Container, Tooltip, Dropdown, IconButton } from '@zextras/carbonio-design-system';
import styled from 'styled-components';
import { ActionsContext } from '../../../../commons/actions-context';

const HoverBarContainer = styled(Container)`
	top: 0;
	right: 0;
	display: none;
	position: absolute;
	background: linear-gradient(to right, transparent, ${({ theme }) => theme.palette.gray6.hover});
	height: 45%;
	width: calc(100% - 64px);
	& > * {
		margin-top: ${({ theme }) => theme.sizes.padding.small};
		margin-right: ${({ theme }) => theme.sizes.padding.small};
	}
`;

const HoverContainer = styled(Container)`
	width: 100%;
	position: relative;
	cursor: pointer;
	text-decoration: none;
	background: ${({ current, theme }) =>
		theme.palette[current ? 'highlight' : 'transparent']?.regular};
	&:hover {
		background: ${({ theme }) => theme.palette.gray6.hover};
		& ${HoverBarContainer} {
			display: flex;
		}
	}
`;

const ListItemActionWrapper = ({
	children,
	current,
	onClick,
	onDoubleClick,
	item,
	isConversation,
	hoverTooltipLabel,
	messagesToRender
}) => {
	const { getMessageActions, getConversationActions } = useContext(ActionsContext);

	const [hoverActions, dropdownActions] = useMemo(() => {
		if (isConversation) {
			return messagesToRender && messagesToRender?.length === 1
				? getMessageActions({ ...item, ...messagesToRender?.[0], tags: item.tags })
				: getConversationActions(item);
		}
		return getMessageActions(item);
	}, [isConversation, getMessageActions, item, messagesToRender, getConversationActions]);
	return (
		<Dropdown
			contextMenu
			items={dropdownActions}
			display="block"
			style={{ width: '100%', height: '64px' }}
		>
			<HoverContainer
				data-testid={isConversation ? `ConversationRow` : `MessageListItem-${item.id}`}
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="unset"
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				current={current}
			>
				{children}
				{/* <Tooltip label={hoverTooltipLabel} overflow="break-word" maxWidth="50vw"> */}
				<HoverBarContainer
					orientation="horizontal"
					mainAlignment="flex-end"
					crossAlignment="center"
				>
					{hoverActions.map((action, index) => (
						<Tooltip key={action.id ?? index} label={action.label}>
							<IconButton
								key={action.id}
								icon={action.icon}
								onClick={(ev) => {
									ev.stopPropagation();
									action.click(ev);
								}}
								size="small"
							/>
						</Tooltip>
					))}
				</HoverBarContainer>
				{/* </Tooltip> */}
			</HoverContainer>
		</Dropdown>
	);
};

export default ListItemActionWrapper;
