/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container, Icon, Text, Padding, Theme, useTheme } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

function getBackDropLayoutStyle(): {
	width: string;
	position: 'absolute';
	height: string;
	zIndex: number;
	top: number;
	left: number;
} {
	return {
		width: '100%',
		position: 'absolute' as const,
		height: '100%',
		zIndex: 2,
		top: 0,
		left: 0
	};
}

function getDropBackgroundStyle(theme: Theme): {
	width: string;
	background: string;
	height: string;
	borderRadius: string;
	left: string;
	pointerEvents: 'none';
} {
	return {
		width: 'calc(100% - 0.625rem)',
		background: `${theme.palette.primary.regular}b9`,
		height: 'calc(100% - 0.625rem)',
		borderRadius: '0.25rem',
		left: '0.3125rem',
		pointerEvents: 'none' as const
	};
}

function getBackDropLayoutInnerBoxStyle(theme: Theme): {
	background: string;
	borderRadius: string;
	minHeight: string;
	maxWidth: string;
	maxHeight: string;
} {
	return {
		background: theme.palette.gray6.regular,
		borderRadius: '0.625rem',
		minHeight: '11.25rem',
		maxWidth: '23.75rem',
		maxHeight: '13.125rem'
	};
}

function getBackDropLayoutContentBox(theme: Theme): {
	borderStyle: 'dashed';
	borderWidth: string;
	borderRadius: string;
	borderColor: string;
	boxSizing: 'border-box';
	padding: string;
} {
	return {
		borderStyle: 'dashed',
		borderWidth: '0.125rem',
		borderRadius: '0.3125rem',
		borderColor: theme.palette.primary.regular,
		boxSizing: 'border-box',
		padding: '2.5rem'
	};
}

type DropZoneAttachmentType = {
	onDragOverEvent: (arg: any) => void;
	onDropEvent: (arg: any) => void;
	onDragLeaveEvent: (arg: any) => void;
};

export const DropZoneAttachment: FC<DropZoneAttachmentType> = ({
	onDragOverEvent,
	onDropEvent,
	onDragLeaveEvent
}) => {
	const theme = useTheme();
	return (
		<>
			<Container
				style={getBackDropLayoutStyle()}
				onDragOver={onDragOverEvent}
				onDrop={onDropEvent}
				onDragLeave={onDragLeaveEvent}
				borderRadius="half"
			>
				<Container style={getDropBackgroundStyle(theme)}>
					<Container style={getBackDropLayoutInnerBoxStyle(theme)}>
						<Padding all="medium">
							<Container style={getBackDropLayoutContentBox(theme)}>
								<Container mainAlignment="center">
									<Container
										mainAlignment="center"
										orientation="horizontal"
										height="2.5rem"
										style={{ marginBottom: '0.5rem' }}
									>
										<Padding right="small" left="small">
											<Icon
												icon="ImageOutline"
												height="2.1875rem"
												width="2.1875rem"
												color="primary"
											/>
										</Padding>
										<Padding right="small" left="small">
											<Icon
												icon="FileAddOutline"
												height="2.1875rem"
												width="2.1875rem"
												color="primary"
											/>
										</Padding>
										<Padding right="small" left="small">
											<Icon
												icon="FilmOutline"
												height="2.1875rem"
												width="2.1875rem"
												color="primary"
											/>
										</Padding>
									</Container>
									<Container mainAlignment="center" height="auto">
										<Text color="primary" weight="bold">
											{t('composer.attachment.drag_and_drop.title', 'Drag&Drop Mode')}
										</Text>
										<Padding top="small" />
										<Text
											style={{
												textAlign: 'center'
											}}
											size="medium"
											weight="regular"
											color="primary"
											overflow="break-word"
										>
											{t(
												'composer.attachment.drag_and_drop.content',
												'Drop here your attachments to quickly add them to this e-mail'
											)}
										</Text>
									</Container>
								</Container>
							</Container>
						</Padding>
					</Container>
				</Container>
			</Container>
		</>
	);
};
