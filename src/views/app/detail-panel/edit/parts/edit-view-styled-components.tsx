/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import styled from 'styled-components';
import { Container, IconCheckbox, Row } from '@zextras/carbonio-design-system';

export const FileInput = styled.input`
	display: none;
`;

export const Divider = styled.div`
	width: 100%;
	min-height: 1px;
	max-height: 1px;
	border-bottom: 1px solid ${(props): string => props.theme.palette.gray2.regular};
`;

export const ResizedIconCheckbox = styled(IconCheckbox)`
	[class^='Padding__Comp'] {
		padding: 6px;
		svg {
			height: 20px;
			width: 20px;
		}
	}
`;

export const TextArea = styled.textarea`
	box-sizing: border-box;
	min-height: 250px;

	flex-grow: 1;
	width: 100%;
	border: none;
	resize: vertical;
	& :focus,
	:active {
		box-shadow: none;
		border: none;
		outline: none;
	}
`;

export const EditorWrapper = styled.div`
	width: 100%;
	height: auto;
	position: relative;

	> .tox:not(.tox-tinymce-inline) {
		width: 100%;
		border: none;
		.tox-editor-container {
			min-height: 300px;
		}
		.tox-editor-header {
			padding: ${(props): string => props.theme.sizes.padding.large};
			background-color: ${(props): string => props.theme.palette.gray6.regular};
		}
		.tox-toolbar__primary {
			background: none;
			background-color: ${(props): string => props.theme.palette.gray4.regular};
			border-radius: ${(props): string => props.theme.borderRadius};
		}
	}
	> .tox {
		.tox-edit-area {
			margin-left: calc(-1rem + ${(props): string => props.theme.sizes.padding.large});
			overflow-y: auto;
			max-height: 100%;
		}
		.tox-edit-area__iframe {
			height: 100%;
			padding-bottom: ${(props): string => props.theme.sizes.padding.large};
		}
		&.tox-tinymce {
			height: 100% !important;
		}
	}
`;

export const BannerContainer = styled(Container)`
	border-bottom: 1px solid ${(props): string => props.theme.palette.info.regular};
	border-top-right-radius: 4px;
	border-top-left-radius: 4px;
	padding: 16px;
`;

export const RowContainer = styled(Container)`
	display: grid;
	grid-template-columns: repeat(12, 1fr);
	grid-gap: 8px;
`;

export const ColContainer = styled.div`
	grid-column: ${({ occupyFull }: { occupyFull: boolean }): string =>
		`span  ${occupyFull ? 12 : 6}`};
`;

export const StickyTime = styled(Row)`
	position: sticky;
	bottom: 10px;
`;
