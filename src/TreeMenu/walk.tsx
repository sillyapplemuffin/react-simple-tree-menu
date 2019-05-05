import { isEmpty } from 'lodash';

export interface TreeNodeObject {
  [name: string]: TreeNode;
}

interface LocaleFunctionProps {
  label: string;
  [name: string]: any;
}

export interface TreeNode extends LocaleFunctionProps {
  index: number;
  nodes?: TreeNodeObject;
}

export interface TreeNodeInArray extends LocaleFunctionProps {
  key: string;
  nodes?: TreeNodeInArray[];
}

export type LocaleFunction = (localeFunctionProps: LocaleFunctionProps) => string;

interface WalkProps {
  data: TreeNodeObject | TreeNodeInArray[];
  parent?: string;
  level?: number;
  openNodes: string[];
  searchTerm: string;
  locale?: LocaleFunction;
}

interface BranchProps {
  parent: string;
  level: number;
  openNodes: string[];
  searchTerm: string;
  node: TreeNode | TreeNodeInArray;
  nodeName: string;
  index?: number;
  locale?: LocaleFunction;
}

export interface Item {
  hasNodes: boolean;
  isOpen: boolean;
  level: number;
  key: string;
  label: string;
  [name: string]: any;
}

const walk = ({ data = {}, ...props }: WalkProps): Item[] => {
  const propsWithDefaultValues = { parent: '', level: 0, ...props };

  return Array.isArray(data)
    ? (data as TreeNodeInArray[]).reduce(
        (all: Item[], node: TreeNodeInArray, index) => [
          ...all,
          ...generateBranch({
            node,
            nodeName: node.key,
            index,
            ...propsWithDefaultValues,
          }),
        ],
        []
      )
    : Object.entries(data as TreeNodeObject)
        .sort((a, b) => a[1].index - b[1].index)
        .reduce(
          (all: Item[], [nodeName, node]: [string, TreeNode]) => [
            ...all,
            ...generateBranch({ node, nodeName, ...propsWithDefaultValues }),
          ],
          []
        );
};

const matchSearch = (label: string, searchTerm: string) => {
  const processString = (text: string): string => text.trim().toLowerCase();
  return processString(label).includes(processString(searchTerm));
};

const defaultLocale = ({ label }: LocaleFunctionProps): string => label;

const generateBranch = ({ node, nodeName, ...props }: BranchProps): Item[] => {
  const { parent, level, openNodes, searchTerm, locale = defaultLocale } = props;

  const { nodes, label: rawLabel = 'unknown', ...nodeProps } = node;
  const key = [parent, nodeName].filter(x => x).join('/');
  const hasNodes = !!nodes && !isEmpty(nodes);
  const isOpen = hasNodes && (openNodes.includes(key) || !!searchTerm);
  const label = locale({ label: rawLabel, ...nodeProps });
  const isVisible = !searchTerm || matchSearch(label, searchTerm);

  const currentItem = { ...props, ...nodeProps, label, hasNodes, isOpen, key };
  const data = Array.isArray(nodes)
    ? (nodes as TreeNodeInArray[])
    : (nodes as TreeNodeObject);
  const nextLevelItems = isOpen
    ? walk({ data, ...props, parent: key, level: level + 1 })
    : [];
  return isVisible ? [currentItem, ...nextLevelItems] : nextLevelItems;
};

export default walk;
