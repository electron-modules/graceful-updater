# 1. clean build
rm -rf ./build

# 2. tsc compile 
`npm bin`/ttsc -p tsconfig.json

# 3. copy helper 
cp -Rv ./src/helper/ ./build/helper
