/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState } from 'react';
import { Container, Text, Row, Icon, Padding } from '@zextras/carbonio-design-system';
import styled from 'styled-components';
import { indexOf } from 'lodash';
import { ListPropsType } from '../../../../types';

const ContainerEl = styled(Container)``;

const Filter = styled(Row)`
	border-bottom: 1px solid ${({ theme }): string => theme.palette.gray2.regular};
	display: block;
	border-radius: 0;
	cursor: pointer;

	&:hover {
		background-color: ${({ theme }): string => theme.palette.gray6.focus};
	}
`;

const ButtonEl = styled(Icon)`
	border: 1px solid
		${({ theme, disabled }): string =>
			disabled ? theme.palette.primary.disabled : theme.palette.primary.regular};
`;

type Item = {
	active: boolean;
	filterActions: Array<any>;
	filterTests: Array<any>;
	id: string;
	name: string;
};
type ComponentProps = {
	selected: boolean;
	unSelect: () => void;
	item: Item;
	listProps: ListPropsType;
};
// // TODO remove the any type after the Accordion refactor in the DS
const FilterItem: FC<any> = ({ item, selected, unSelect, listProps }): ReactElement => {
	const { toggle, list, moveDown, moveUp } = listProps;
	const _onClick = useCallback(() => {
		unSelect();
		toggle(item.id);
	}, [item.id, toggle, unSelect]);
	const background = useMemo(() => (selected ? 'highlight' : ''), [selected]);
	const index = useMemo(() => indexOf(list, item), [list, item]);
	const disableMoveUp = useMemo(() => index === 0, [index]);
	const disableMoveDown = useMemo(() => index === list.length - 1, [index, list.length]);
	const [hovered, setHovered] = useState(false);
	const onMouseEnter = useCallback(() => setHovered(true), []);
	const onMouseLeave = useCallback(() => setHovered(false), []);

	const onMoveUp = useCallback(() => moveUp(index), [index, moveUp]);
	const onMoveDown = useCallback(() => moveDown(index), [index, moveDown]);

	return (
		<Filter
			onClick={_onClick}
			height="fit"
			background={background}
			orientation="horizontal"
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<Row height="40px" padding={{ all: 'small' }}>
				<ContainerEl width="80%" crossAlignment="flex-start">
					<Text size="small">{item?.name}</Text>
				</ContainerEl>

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
		</Filter>
	);
};

export default FilterItem;
