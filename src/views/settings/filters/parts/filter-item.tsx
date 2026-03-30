/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { Container, Text, Row, Icon, Padding } from '@zextras/carbonio-design-system';

import { Filter } from 'types/filters';

const StyledFilterRow = styled(Row)`
	border-bottom: 0.0625rem solid ${({ theme }): string => theme.palette.gray2.regular};
	display: block;
	border-radius: 0;
	cursor: pointer;

	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

const ButtonEl = styled(Icon)`
	border: 0.0625rem solid
		${({ theme, disabled }): string =>
			disabled ? theme.palette.primary.disabled : theme.palette.primary.regular};
`;

type FilterItemProps = {
	item: Filter;
	selected: boolean;
	index: number;
	disableMoveUp: boolean;
	disableMoveDown: boolean;
	unSelect: () => void;
	toggle: (arg: string) => void;
	moveDown: (arg: number) => void;
	moveUp: (arg: number) => void;
};

export const FilterItem: FC<FilterItemProps> = ({
	item,
	selected,
	index,
	disableMoveUp,
	disableMoveDown,
	unSelect,
	toggle,
	moveDown,
	moveUp
}): ReactElement => {
	const _onClick = useCallback(() => {
		unSelect();
		toggle(item.name);
	}, [item.name, toggle, unSelect]);
	const background = useMemo(() => (selected ? 'highlight' : ''), [selected]);
	const [hovered, setHovered] = useState(false);
	const onMouseEnter = useCallback(() => setHovered(true), []);
	const onMouseLeave = useCallback(() => setHovered(false), []);

	const onMoveUp = useCallback(() => moveUp(index), [index, moveUp]);
	const onMoveDown = useCallback(() => moveDown(index), [index, moveDown]);

	return (
		<StyledFilterRow
			onClick={_onClick}
			height="fit"
			background={background}
			orientation="horizontal"
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<Row height="2.5rem" padding={{ all: 'small' }}>
				<Container width="80%" crossAlignment="flex-start">
					<Text size="small">{item?.name}</Text>
				</Container>

				<Container width="20%" orientation="horizontal" mainAlignment="flex-end">
					{hovered && (
						<>
							<ButtonEl
								icon="ArrowheadUpOutline"
								color="primary"
								disabled={disableMoveUp}
								size="large"
								onClick={onMoveUp}
							/>
							<Padding right="small" />
							<ButtonEl
								icon="ArrowheadDownOutline"
								color="primary"
								disabled={disableMoveDown}
								size="large"
								onClick={onMoveDown}
							/>
						</>
					)}
				</Container>
			</Row>
		</StyledFilterRow>
	);
};
