/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactElement, useCallback, useRef, useState } from 'react';

import { Badge, Chip, Container, Padding, Popover, Text } from '@zextras/carbonio-design-system';
import { Tag, useRunSearchIntegration } from '@zextras/carbonio-ui-commons';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

const Separator = (): React.JSX.Element => (
	<Padding horizontal="extrasmall">
		<Text color="secondary" size="small">
			{','}
		</Text>
	</Padding>
);

const CompactViewTags = ({
	tags,
	triggerSearch
}: {
	tags: Tag[];
	triggerSearch: (tagToSearch: Tag) => void;
}): ReactElement | null => {
	const [open, setOpen] = useState(false);
	const popOverRef = useRef(null);

	const toggleOpen = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
		ev.stopPropagation();
		setOpen(true);
	};

	if (tags.length === 0) {
		return null;
	}

	return (
		<>
			<Chip
				key={tags[0].id}
				label={tags[0].name}
				ref={popOverRef}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore // TODO: fix type in Tag interface
				avatarBackground={tags[0].color}
				background="gray2"
				hasAvatar={false}
				avatarIcon="Tag"
				onClick={(): void => triggerSearch(tags[0])}
			/>
			{tags.length > 1 && (
				<>
					<Separator />
					<Badge
						color="text"
						maxValue={tags.length - 1}
						value={`+${tags.length - 1}`}
						onClick={toggleOpen}
					/>
					<Popover
						open={open}
						anchorEl={popOverRef}
						placement="bottom-start"
						disablePortal
						styleAsModal
						onClose={(): void => setOpen(false)}
					>
						<Container
							maxHeight="500px"
							style={{ overflowY: 'auto' }}
							crossAlignment="flex-start"
							padding={{ all: 'small' }}
							gap="0.5rem"
						>
							{map(tags.slice(1), (tag) => (
								<Chip
									key={tag.id}
									label={tag?.name}
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore // TODO: fix type in Tag interface
									avatarBackground={tag.color}
									background="gray2"
									avatarIcon="Tag"
									onClick={(): void => triggerSearch(tag)}
								/>
							))}
						</Container>
					</Popover>
				</>
			)}
		</>
	);
};

const ExpandedViewTags = ({
	tags,
	triggerSearch
}: {
	tags: Tag[];
	triggerSearch: (tagToSearch: Tag) => void;
}): ReactElement | null => {
	if (tags.length === 0) {
		return null;
	}

	return (
		<>
			{map(tags, (tag, index) => (
				<>
					<Chip
						key={tag.id}
						label={tag?.name}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore // TODO: fix type in Tag interface
						avatarBackground={tag.color}
						background="gray2"
						hasAvatar
						avatarIcon="Tag"
						onClick={(): void => triggerSearch(tag)}
					/>
					{index !== tags.length - 1 && <Separator />}
				</>
			))}
		</>
	);
};

export const TagsInExpandedHeader = ({
	isEml,
	tags,
	open,
	isWide
}: {
	isEml?: boolean;
	tags: Tag[];
	open: boolean;
	isWide: boolean;
}): ReactElement | undefined => {
	const [t] = useTranslation();
	const tagLabel = t('label.tags', 'Tags');

	const runSearch = useRunSearchIntegration();

	const triggerSearch = useCallback(
		(tagToSearch: Tag) =>
			runSearch?.(
				[
					{
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore // TODO: fix type in Tag interface
						avatarBackground: tagToSearch?.color,
						avatarIcon: 'Tag',
						background: 'gray2',
						hasAvatar: true,
						isGeneric: false,
						isQueryFilter: true,
						label: `tag:${tagToSearch?.name}`,
						value: `tag:"${tagToSearch?.name}"`
					}
				],
				'mails'
			),
		[runSearch]
	);

	return !isEml && tags.length > 0 && open ? (
		<Container
			data-testid="tags-in-expanded-header"
			orientation="horizontal"
			crossAlignment="flex-start"
			mainAlignment="flex-start"
			padding={{ left: 'extralarge', bottom: 'small' }}
		>
			<Padding left="small" />
			<Text color="secondary" size="small" overflow="break-word">
				{tagLabel}:
			</Text>
			<Padding left="small" />
			{isWide ? (
				<ExpandedViewTags tags={tags} triggerSearch={triggerSearch} />
			) : (
				<CompactViewTags tags={tags} triggerSearch={triggerSearch} />
			)}
		</Container>
	) : undefined;
};
