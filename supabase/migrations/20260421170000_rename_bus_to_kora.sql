-- Migration to rename BUs from old names to new Kora names
-- Old names: intelligence, development, creative, corporate
-- New names: kora-agents, kora-dev, kora-studio, kora-corp

-- Step 1: Drop existing CHECK constraints on each table
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_bu_check;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_bu_check;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_bu_check;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_bu_check;
ALTER TABLE processes DROP CONSTRAINT IF EXISTS processes_category_check;

-- Step 2: Update existing data values
UPDATE clients SET bu = 'kora-agents' WHERE bu = 'intelligence';
UPDATE clients SET bu = 'kora-dev' WHERE bu = 'development';
UPDATE clients SET bu = 'kora-studio' WHERE bu = 'creative';
UPDATE clients SET bu = 'kora-corp' WHERE bu = 'corporate';

UPDATE projects SET bu = 'kora-agents' WHERE bu = 'intelligence';
UPDATE projects SET bu = 'kora-dev' WHERE bu = 'development';
UPDATE projects SET bu = 'kora-studio' WHERE bu = 'creative';
UPDATE projects SET bu = 'kora-corp' WHERE bu = 'corporate';

UPDATE tasks SET bu = 'kora-agents' WHERE bu = 'intelligence';
UPDATE tasks SET bu = 'kora-dev' WHERE bu = 'development';
UPDATE tasks SET bu = 'kora-studio' WHERE bu = 'creative';
UPDATE tasks SET bu = 'kora-corp' WHERE bu = 'corporate';

UPDATE contracts SET bu = 'kora-agents' WHERE bu = 'intelligence';
UPDATE contracts SET bu = 'kora-dev' WHERE bu = 'development';
UPDATE contracts SET bu = 'kora-studio' WHERE bu = 'creative';
UPDATE contracts SET bu = 'kora-corp' WHERE bu = 'corporate';

UPDATE processes SET category = 'kora-agents' WHERE category = 'intelligence';
UPDATE processes SET category = 'kora-dev' WHERE category = 'development';
UPDATE processes SET category = 'kora-studio' WHERE category = 'creative';
UPDATE processes SET category = 'kora-corp' WHERE category = 'corporate';

-- Step 3: Add new CHECK constraints with new values
ALTER TABLE clients ADD CONSTRAINT clients_bu_check CHECK (bu IS NULL OR bu IN ('kora-agents', 'kora-dev', 'kora-studio', 'kora-corp'));
ALTER TABLE projects ADD CONSTRAINT projects_bu_check CHECK (bu IS NULL OR bu IN ('kora-agents', 'kora-dev', 'kora-studio', 'kora-corp'));
ALTER TABLE tasks ADD CONSTRAINT tasks_bu_check CHECK (bu IS NULL OR bu IN ('kora-agents', 'kora-dev', 'kora-studio', 'kora-corp'));
ALTER TABLE contracts ADD CONSTRAINT contracts_bu_check CHECK (bu IS NULL OR bu IN ('kora-agents', 'kora-dev', 'kora-studio', 'kora-corp'));
ALTER TABLE processes ADD CONSTRAINT processes_category_check CHECK (category IN ('kora-agents', 'kora-dev', 'kora-studio', 'kora-corp'));