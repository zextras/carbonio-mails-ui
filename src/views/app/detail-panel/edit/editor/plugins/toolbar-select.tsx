/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import styled from '@emotion/styled';
import { Select } from '@zextras/carbonio-design-system';

// `styled()` drops the generic call signature of the design-system `Select`,
// which would type the `onChange` value as `{}` and reject a type argument
// like `<BlockType>`; cast it back to keep `Select`'s generics.
export const ToolbarSelect = styled(Select)`
	& > div > div {
		padding: 0.5rem;
		border-radius: 0.125rem;
		align-items: center;
	}

	& > div > div > div > div:first-child {
		padding-top: 0;
	}

	& [data-testid='divider'] {
		display: none;
	}
` as typeof Select;
